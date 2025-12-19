import { GameConfig, GameState, Player, GamePhase } from "../../shared";
import logger from "./logger";

export class GameInstance {
  public state: GameState;
  public lastActivityAt: number = Date.now();
  private timerRef: NodeJS.Timeout | null = null;

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
      config: this.config, // Passed to frontend for Timer/Video looping logic
    };
  }

  public start() {
    if (this.state.phase !== "LOBBY") return;
    logger.info(`[Game ${this.roomCode}] Phase Transition: LOBBY -> ROUND_PLAYING`);
    this.nextRound();
  }

  private nextRound() {
    if (this.state.currentRound >= this.config.numRounds) {
      this.transitionTo("GAME_OVER", 0);
      return;
    }

    this.state.currentRound++;
    // Reset round-specific flags
    Object.values(this.state.players).forEach(p => p.hasGuessed = false);
    
    const sketch = this.config.sketches[this.state.currentRound - 1];
    
    // Anti-Cheat: Only send Video/ID. Name and Description are stripped.
    this.state.currentSketch = { 
      youtubeId: sketch.youtubeId,
      id: sketch.id 
    };

    this.transitionTo("ROUND_PLAYING", this.config.roundLength, () => this.revealRound());
  }

  private revealRound() {
    const fullSketch = this.config.sketches[this.state.currentRound - 1];
    this.state.currentSketch = fullSketch; // Full reveal
    
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
    if (!player || player.hasGuessed || this.state.phase !== "ROUND_PLAYING") return;

    player.hasGuessed = true;
    this.lastActivityAt = Date.now();

    const actualSketch = this.config.sketches[this.state.currentRound - 1];
    const isCorrect = guessName.toLowerCase().trim() === actualSketch.name.toLowerCase().trim();

    if (isCorrect) {
      const remaining = Math.max(0, this.state.endsAt - Date.now());
      // Scoring: 500 base + (0-500) speed bonus
      const bonus = Math.floor((remaining / (this.config.roundLength * 1000)) * 500);
      player.score += (500 + bonus);
    }

    this.state.guessFeed.push({ 
      playerName: player.name, 
      text: isCorrect ? "guessed the sketch!" : guessName, 
      isCorrect 
    });
    
    this.onUpdate({ ...this.state });
  }

  public addPlayer(player: Player) {
    this.state.players[player.clientId] = player;
    this.lastActivityAt = Date.now();
    this.onUpdate({ ...this.state });
  }

  public removePlayer(clientId: string) {
    if (this.state.players[clientId]) {
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
    }
  }

  public destroy() {
    if (this.timerRef) {
        clearTimeout(this.timerRef);
        this.timerRef = null;
    }
  }
}