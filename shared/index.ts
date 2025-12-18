export type GamePhase = "LOBBY" | "ROUND_PLAYING" | "ROUND_REVEAL" | "GAME_OVER";

export interface Sketch {
  id: string;
  name: string;
  youtubeId: string;
  description: string;
  tags: string[];
}

export interface Player {
  clientId: string;
  name: string;
  score: number;
  connected: boolean;
  hasGuessed: boolean;
}

export interface GameConfig {
  numRounds: number;
  clipLength: number;
  roundLength: number;
  roundEndLength: number;
  sketches: Sketch[];
}

export interface GameState {
  phase: GamePhase;
  hostId: string; 
  currentRound: number;
  endsAt: number;
  players: Record<string, Player>;
  currentSketch?: Partial<Sketch>; 
  guessFeed: Array<{ playerName: string; text: string; isCorrect: boolean }>;
}