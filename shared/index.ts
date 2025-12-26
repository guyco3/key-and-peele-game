export type GamePhase = "LOBBY" | "ROUND_PLAYING" | "ROUND_REVEAL" | "GAME_OVER";
 
export type DifficultyMode = "easy" | "medium" | "hard" | "all";
export interface Sketch {
  id: string;
  name: string;
  youtubeId: string;
  description: string;
  tags: string[];
  // Difficulty is optional on existing data; new sketches should include it.
  difficulty?: DifficultyMode;
  views?: number;
  startTime?: number;
}

export interface Player {
  clientId: string;
  name: string;
  score: number;
  connected: boolean;
  hasGuessed: boolean;
  lastGuessCorrect: boolean;
  lastGuessSketch: string;
}

export interface GameConfig {
  numRounds: number;
  clipLength: number;
  roundLength: number;
  roundEndLength: number;
  randomStartTime?: boolean;
  isPublic: boolean;
  difficulty?: DifficultyMode;
}

export interface GameState {
  phase: GamePhase;
  hostId: string;
  roomCode: string;
  currentRound: number;
  endsAt: number;
  players: Record<string, Player>;
  currentSketch?: Partial<Sketch> & { startTime?: number };
  guessFeed: Array<{ playerName: string; text: string; isCorrect: boolean }>;
  config: GameConfig;
}