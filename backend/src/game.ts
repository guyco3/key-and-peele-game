import { GameConfig, GameState, Player, GamePhase, Sketch } from "../../shared";
import logger from "./logger";
import { SKETCHES } from "../../shared/sketches";

export class GameInstance {
  public state: GameState;
  public lastActivityAt: number = Date.now();
  private timerRef: NodeJS.Timeout | null = null;
  private activeSketch: Sketch | null = null;

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
        logger.info(`[Game ${this.roomCode}] Instance created.`);
    }

  public start() {
    if (this.state.phase !== "LOBBY") {
      logger.warn(`[Game ${this.roomCode}] Attempted to start from invalid phase: ${this.state.phase}`);
      return;
    }
    logger.info(`[Game ${this.roomCode}] Starting game...`);
    this.nextRound();
  }

  private pickRandomSketch(excludeId?: string): Sketch {
    const pool = SKETCHES;
    if (pool.length === 0) {
      throw new Error(`No sketches available for game ${this.roomCode}`);
    }
    const filtered = excludeId ? pool.filter(s => s.id !== excludeId) : pool;
    const choicePool = filtered.length > 0 ? filtered : pool;
    const choice = choicePool[Math.floor(Math.random() * choicePool.length)];
    return choice;
  }

  private nextRound() {
    if (this.state.currentRound >= this.config.numRounds) {
      logger.info(`[Game ${this.roomCode}] All rounds complete. Transitioning to GAME_OVER.`);
      this.transitionTo("GAME_OVER", 0);
      return;
    }

    this.state.currentRound++;
    // Reset "hasGuessed" for everyone
    Object.values(this.state.players).forEach(p => p.hasGuessed = false);
    
    this.activeSketch = this.pickRandomSketch();
    const sketch = this.activeSketch;
    
    // DATA MASKING: Only send the ID and Video during the round
    this.state.currentSketch = { 
      youtubeId: sketch.youtubeId,
      id: sketch.id 
    };

    logger.info(`[Game ${this.roomCode}] Round ${this.state.currentRound}/${this.config.numRounds} started.`);
    this.transitionTo("ROUND_PLAYING", this.config.roundLength, () => this.revealRound());
  }

  private revealRound() {
    const fullSketch = this.activeSketch || this.config.sketches[0];
    this.state.currentSketch = fullSketch; // Full reveal (name, desc)
    
    logger.info(`[Game ${this.roomCode}] Round ${this.state.currentRound} revealed. Sketch: ${fullSketch.name}`);
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
    if (!player) {
      logger.warn(`[Game ${this.roomCode}] Guess received from unknown clientId: ${clientId}`);
      return;
    }

    if (player.hasGuessed || this.state.phase !== "ROUND_PLAYING") {
      logger.debug(`[Game ${this.roomCode}] Ignoring guess from ${player.name} (Already guessed or wrong phase)`);
      return;
    }

    player.hasGuessed = true;
    const actualSketch = this.activeSketch || this.config.sketches[0];
    const isCorrect = guessName.toLowerCase().trim() === actualSketch.name.toLowerCase().trim();

    if (isCorrect) {
      const remaining = Math.max(0, this.state.endsAt - Date.now());
      // Scoring: 500 base + speed bonus
      const bonus = Math.floor((remaining / (this.config.roundLength * 1000)) * 500);
      player.score += (500 + bonus);
      logger.info(`[Game ${this.roomCode}] ${player.name} guessed CORRECTLY. Points awarded: ${500 + bonus}`);
    } else {
      logger.debug(`[Game ${this.roomCode}] ${player.name} guessed incorrectly: "${guessName}"`);
    }

    this.state.guessFeed.push({ 
      playerName: player.name, 
      text: isCorrect ? "guessed the sketch!" : guessName, 
      isCorrect 
    });
    
    this.onUpdate({ ...this.state });
  }

  public addPlayer(player: Player) {
    logger.info(`[Game ${this.roomCode}] Adding player: ${player.name} (${player.clientId})`);
    this.state.players[player.clientId] = player;
    this.lastActivityAt = Date.now();
    this.onUpdate({ ...this.state });
  }

  public removePlayer(clientId: string) {
    const player = this.state.players[clientId];
    if (player) {
      logger.info(`[Game ${this.roomCode}] Removing player: ${player.name} (${clientId})`);
      delete this.state.players[clientId];
      this.lastActivityAt = Date.now();
      this.onUpdate({ ...this.state });
    }
  }

  public setConnectionStatus(clientId: string, status: boolean) {
    const player = this.state.players[clientId];
    if (player) {
      player.connected = status;
      this.lastActivityAt = Date.now();
      this.onUpdate({ ...this.state });
      logger.debug(`[Game ${this.roomCode}] Player ${player.name} connection status: ${status ? 'ONLINE' : 'OFFLINE'}`);
    }
  }

  public rerollVideoForError(clientId: string, errorCode: number, message?: string) {
    if (this.state.phase !== "ROUND_PLAYING") {
      logger.debug(`[Game ${this.roomCode}] Ignoring video error; phase=${this.state.phase}`);
      return;
    }

    const reporter = this.state.players[clientId];
    const playerName = reporter?.name || "Someone";

    const newSketch = this.pickRandomSketch(this.activeSketch?.id);
    this.activeSketch = newSketch;
    this.state.currentSketch = { id: newSketch.id, youtubeId: newSketch.youtubeId };
    this.state.guessFeed.push({
      playerName: "System",
      text: `Video didn't work for ${playerName}. Finding a new video.`,
      isCorrect: false
    });
    this.lastActivityAt = Date.now();
    this.onUpdate({ ...this.state });

    logger.warn(`[Game ${this.roomCode}] Video error from ${playerName}; swapping video. Code=${errorCode}. ${message || ""}`);
  }

  public destroy() {
    logger.info(`[Game ${this.roomCode}] Instance destroying. Cleaning up timers.`);
    if (this.timerRef) {
        clearTimeout(this.timerRef);
        this.timerRef = null;
    }
  }
}
