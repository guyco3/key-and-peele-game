import { GameConfig, GameState, Player, GamePhase, Sketch } from "../../shared";
import logger from "./logger";
import { SKETCHES } from "../../shared/sketches";

export class GameInstance {
  public state: GameState;
  public lastActivityAt: number = Date.now(); // ⏱️ Used by index.ts for GC
  private timerRef: NodeJS.Timeout | null = null;
  private activeSketch: Sketch | null = null;
  private blockedSketchIds: Set<string> = new Set();
  
  private calculateStartTime(): number {
    if (!this.config.randomStartTime) return 0;
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
    
    const h = this.state.players[host.clientId];
    if (h) {
      h.hasGuessed = !!h.hasGuessed;
      h.lastGuessCorrect = !!h.lastGuessCorrect;
      h.lastGuessSketch = h.lastGuessSketch || "";
    }
    logger.info(`[Game ${this.roomCode}] Instance created.`);
  }

  /**
   * RESET ACTIVITY: Called internally whenever something happens.
   * Prevents the 2-minute GC from killing active rooms.
   */
  private touch() {
    this.lastActivityAt = Date.now();
  }

  public start() {
    if (this.state.phase !== "LOBBY") return;
    this.touch();
    logger.info(`[Game ${this.roomCode}] Starting game...`);
    this.nextRound();
  }

  private pickRandomSketch(): Sketch {
    const mode = (this.config && this.config.difficulty) ? this.config.difficulty : "all";
    let difficultyPool = SKETCHES;
    if (mode !== "all") {
      difficultyPool = SKETCHES.filter(s => (s.difficulty) === mode);
    }

    const availablePool = difficultyPool.filter(s => !this.blockedSketchIds.has(s.id));
    let choicePool = availablePool.length > 0 ? availablePool : (difficultyPool.length > 0 ? difficultyPool : SKETCHES);

    if (choicePool.length === 0) {
      throw new Error(`Critical Error: No sketches found for room ${this.roomCode}`);
    }

    return choicePool[Math.floor(Math.random() * choicePool.length)];
  }

  private nextRound() {
    if (this.state.currentRound >= this.config.numRounds) {
      this.transitionTo("GAME_OVER", 0);
      return;
    }

    this.state.currentRound++;
    Object.values(this.state.players).forEach(p => {
      p.hasGuessed = false;
      p.lastGuessCorrect = false;
      p.lastGuessSketch = "";
    });
    
    const sketch = this.pickRandomSketch();
    if (!sketch) {
        this.transitionTo("GAME_OVER", 0);
        return;
    }
    this.activeSketch = sketch;
    
    this.state.currentSketch = {
      youtubeId: this.activeSketch.youtubeId,
      id: this.activeSketch.id,
      startTime: this.calculateStartTime()
    };

    this.transitionTo("ROUND_PLAYING", this.config.roundLength, () => this.revealRound());
  }

  private revealRound() {
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
    this.touch(); // Update activity on phase change
    
    this.onUpdate({ ...this.state });

    if (seconds > 0 && callback) {
      this.timerRef = setTimeout(callback, seconds * 1000);
    }
  }

  public submitGuess(clientId: string, guessName: string) {
    const player = this.state.players[clientId];
    const actual = this.activeSketch;

    if (!player || !actual || this.state.phase !== "ROUND_PLAYING" || player.hasGuessed) {
      return;
    }

    this.touch(); // ⏱️ Reset 2-min GC timer because someone is guessing!

    const normalizedGuess = guessName.toLowerCase().trim();
    const normalizedAnswer = actual.name.toLowerCase().trim();
    const isCorrect = normalizedGuess === normalizedAnswer;

    player.hasGuessed = true;
    player.lastGuessCorrect = isCorrect;
    player.lastGuessSketch = guessName;

    if (isCorrect) {
      const remainingMs = Math.max(0, this.state.endsAt - Date.now());
      const bonus = Math.floor((remainingMs / (this.config.roundLength * 1000)) * 500);
      player.score += (500 + bonus);
    }

    const players = Object.values(this.state.players);
    const everyoneFinished = players.every(p => p.hasGuessed);

    if (everyoneFinished) {
      this.revealRound();
      return;
    }
    
    this.onUpdate({ ...this.state });
  }

  public rerollVideoForError(clientId: string, errorCode: number) {
    if (this.state.phase !== "ROUND_PLAYING") return;
    this.touch();

    const reporter = this.state.players[clientId];
    
    if (this.activeSketch) {
      this.blockedSketchIds.add(this.activeSketch.id);
    }

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
    this.touch(); // ⏱️ Reset GC timer when someone joins
    player.hasGuessed = !!player.hasGuessed;
    player.lastGuessCorrect = !!player.lastGuessCorrect;
    player.lastGuessSketch = player.lastGuessSketch || "";
    this.state.players[player.clientId] = player;
    this.onUpdate({ ...this.state });
  }

  public removePlayer(clientId: string) {
    if (this.state.players[clientId]) {
      this.touch();
      delete this.state.players[clientId];
      
      if (this.state.phase === "ROUND_PLAYING") {
        const players = Object.values(this.state.players);
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
      this.touch();
      player.connected = status;
      this.onUpdate({ ...this.state });
    }
  }

  public destroy() {
    if (this.timerRef) clearTimeout(this.timerRef);
  }
}