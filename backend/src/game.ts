import { GameConfig, GameState, Player, GamePhase, Sketch } from "../../shared";
import logger from "./logger";
import { SKETCHES } from "../../shared/sketches";

export class GameInstance {
  public state: GameState;
  public lastActivityAt: number = Date.now();
  private timerRef: NodeJS.Timeout | null = null;
  private activeSketch: Sketch | null = null;
  private blockedSketchIds: Set<string> = new Set();
  
  /**
   * 🎲 Helper: Calculates a random start time (seconds) when enabled in config.
   */
  private calculateStartTime(): number {
    if (!this.config.randomStartTime) return 0;
    // Choose random integer between 0 and 90 (inclusive)
    return Math.floor(Math.random() * 91);
  }

  constructor(
    public id: string,
    public roomCode: string,
    private config: GameConfig,
    host: Player,
    private onUpdate: (state: GameState) => void
  ) {
    this.state = {
      phase: "LOBBY",
      hostId: host.clientId,
      roomCode: this.roomCode,
      currentRound: 0,
      endsAt: 0,
      players: { [host.clientId]: host },
      guessFeed: [],
      config: this.config,
    };
    // Ensure the host player has required round-tracking fields
    const h = this.state.players[host.clientId];
    if (h) {
      h.hasGuessed = !!h.hasGuessed;
      h.lastGuessCorrect = !!h.lastGuessCorrect;
      h.lastGuessSketch = h.lastGuessSketch || "";
    }
    logger.info(`[Game ${this.roomCode}] Instance created.`);
  }

  public start() {
    if (this.state.phase !== "LOBBY") return;
    logger.info(`[Game ${this.roomCode}] Starting game...`);
    this.nextRound();
  }

  /**
   * 🎲 Logic: Picks a random sketch, excluding known blocked ones.
   */
  private pickRandomSketch(): Sketch {
    // Respect configured difficulty when selecting sketches
    const mode = (this.config && this.config.difficulty) ? this.config.difficulty : "all";

    // First, build a pool filtered by difficulty (treat missing difficulty on sketches as 'medium')
    let difficultyPool = SKETCHES;
    if (mode !== "all") {
      difficultyPool = SKETCHES.filter(s => (s.difficulty || "medium") === mode);
    }

    // Then filter out sketches that have been flagged as blocked in this session
    const availablePool = difficultyPool.filter(s => !this.blockedSketchIds.has(s.id));

    // Fallbacks: prefer availablePool, then difficultyPool, then full SKETCHES
    let choicePool = availablePool.length > 0 ? availablePool : (difficultyPool.length > 0 ? difficultyPool : SKETCHES);

    if (choicePool.length === 0) {
      throw new Error(`Critical Error: The SKETCHES data list is empty for room ${this.roomCode}`);
    }

    return choicePool[Math.floor(Math.random() * choicePool.length)];
  }

  private nextRound() {
    if (this.state.currentRound >= this.config.numRounds) {
      this.transitionTo("GAME_OVER", 0);
      return;
    }

    this.state.currentRound++;
    // Reset round-related state for everyone
    Object.values(this.state.players).forEach(p => {
      p.hasGuessed = false;
      p.lastGuessCorrect = false;
      p.lastGuessSketch = "";
    });
    
    const sketch = this.pickRandomSketch();
    if (!sketch) {
        logger.error(`[Game ${this.roomCode}] Failed to pick a sketch. Ending game.`);
        this.transitionTo("GAME_OVER", 0);
        return;
    }
    this.activeSketch = sketch;
    
    // 🛡️ DATA MASKING: Only send non-spoiler data to the clients
    this.state.currentSketch = {
      youtubeId: this.activeSketch.youtubeId,
      id: this.activeSketch.id,
      startTime: this.calculateStartTime()
    };

    logger.info(`[Game ${this.roomCode}] Round ${this.state.currentRound} started.`);
    this.transitionTo("ROUND_PLAYING", this.config.roundLength, () => this.revealRound());
  }

  private revealRound() {
    // 🔓 REVEAL: Send the full metadata (name/description)
    if (this.activeSketch) {
      this.state.currentSketch = this.activeSketch;
    }
    
    this.transitionTo("ROUND_REVEAL", this.config.roundEndLength, () => this.nextRound());
  }

  private transitionTo(phase: GamePhase, seconds: number, callback?: () => void) {
    if (this.timerRef) {
      clearTimeout(this.timerRef);
      this.timerRef = null;
    }

    this.state.phase = phase;
    this.state.endsAt = seconds > 0 ? Date.now() + (seconds * 1000) : 0;
    this.lastActivityAt = Date.now();
    
    this.onUpdate({ ...this.state });

    if (seconds > 0 && callback) {
      this.timerRef = setTimeout(callback, seconds * 1000);
    }
  }

  public submitGuess(clientId: string, guessName: string) {
    const player = this.state.players[clientId];
    const actual = this.activeSketch;

    // 🛡️ Block if player doesn't exist, sketch isn't active, 
    // round isn't playing, or they already used their one guess.
    if (!player || !actual || this.state.phase !== "ROUND_PLAYING" || player.hasGuessed) {
      return;
    }

    const normalizedGuess = guessName.toLowerCase().trim();
    const normalizedAnswer = actual.name.toLowerCase().trim();
    const isCorrect = normalizedGuess === normalizedAnswer;

    // MARK AS GUESSED: They used their one attempt
    player.hasGuessed = true;
    // Record correctness directly on the player
    player.lastGuessCorrect = isCorrect;
    // Store the raw guess so the player can see what they submitted
    player.lastGuessSketch = guessName;

    if (isCorrect) {
      const remainingMs = Math.max(0, this.state.endsAt - Date.now());
      const bonus = Math.floor((remainingMs / (this.config.roundLength * 1000)) * 500);
      player.score += (500 + bonus);
    }

    // Push the guess to the feed so others see the attempt
    // this.state.guessFeed.push({ 
    //   playerName: player.name, 
    //   text: isCorrect ? "guessed the sketch!" : guessName, 
    //   isCorrect 
    // });

    // Check if everyone has now submitted their one guess
    const players = Object.values(this.state.players);
    const everyoneFinished = players.every(p => p.hasGuessed);

    if (everyoneFinished) {
      logger.info(`[Game ${this.roomCode}] All players have submitted their guess. Ending round.`);
      this.revealRound();
      return;
    }
    
    this.onUpdate({ ...this.state });
  }

  public rerollVideoForError(clientId: string, errorCode: number) {
    if (this.state.phase !== "ROUND_PLAYING") return;

    const reporter = this.state.players[clientId];
    
    // 1. Add current sketch to blocked list so it's never picked again
    if (this.activeSketch) {
      logger.warn(`[Game ${this.roomCode}] Flagging sketch ${this.activeSketch.id} as BLOCKED.`);
      this.blockedSketchIds.add(this.activeSketch.id);
    }

    // 2. Pick a new sketch (which will now filter out the blocked one)
    const newSketch = this.pickRandomSketch();
    this.activeSketch = newSketch;
    this.state.currentSketch = { id: newSketch.id, youtubeId: newSketch.youtubeId, startTime: this.calculateStartTime() };
    
    this.state.guessFeed.push({
      playerName: "System",
      text: `Video blocked for ${reporter?.name || 'someone'}. Finding new sketch...`,
      isCorrect: false
    });

    this.transitionTo("ROUND_PLAYING", this.config.roundLength, () => this.revealRound());
  }

  public addPlayer(player: Player) {
    // Ensure new players have the round-tracking defaults
    player.hasGuessed = !!player.hasGuessed;
    player.lastGuessCorrect = !!player.lastGuessCorrect;
    player.lastGuessSketch = player.lastGuessSketch || "";
    this.state.players[player.clientId] = player;
    this.onUpdate({ ...this.state });
  }

  public removePlayer(clientId: string) {
      if (this.state.players[clientId]) {
        delete this.state.players[clientId];
        
        // If a round is active, check if the remaining players have all finished
        if (this.state.phase === "ROUND_PLAYING") {
          const players = Object.values(this.state.players);
          // Ensure there is at least one player left, and they've all guessed
          if (players.length > 0 && players.every(p => p.hasGuessed)) {
            this.revealRound();
            return;
          }
        }

        this.onUpdate({ ...this.state });
      }
    }

  public setConnectionStatus(clientId: string, status: boolean) {
    const player = this.state.players[clientId];
    if (player) {
      player.connected = status;
      this.onUpdate({ ...this.state });
    }
  }

  public destroy() {
    if (this.timerRef) clearTimeout(this.timerRef);
  }
}