// Shared types for Key & Peele Game

// Game status constants
export type GameStatus = 'landing' | 'lobby' | 'round' | 'round_end' | 'game_over';

// Player interface
export interface Player {
  name: string;
  score: number;
  clientId: string;
}

// Video/Sketch interface
export interface Video {
  url: string;
  startTime: number;
  endTime: number;
  name: string;
}

export interface Sketch {
  id: string;
  name: string;
  youtubeId: string;
  description: string;
  tags: string[];
}

// Game rules
export interface GameRules {
  rounds: number;
  segmentStartTime: number;
  segmentEndTime: number;
}

// Room interface (backend)
export interface Room {
  roomId: string;
  hostId: string; // socket.id of host (can change)
  hostClientId: string; // persistent clientId of host
  status: GameStatus;
  rules: GameRules;
  players: Record<string, Player>;
  currentRound: number;
  currentSketch: Sketch | null;
  currentVideo: Video | null;
  roundStartTime: number | null;
}

// Game state (frontend)
export interface GameState {
  status: GameStatus;
  roomId: string;
  hostId: string; // This is hostClientId from backend
  name: string;
  clientId: string;
  players: Record<string, Player>;
  round: number;
  video: Video | null;
  scores: Record<string, Player>;
  numRounds: number;
}

// Socket event payloads
export interface CreateRoomPayload {
  name: string;
  clientId: string;
  rules: Partial<GameRules>;
}

export interface JoinRoomPayload {
  roomId: string;
  name: string;
  clientId: string;
}

export interface RoomCreatedEvent {
  roomId: string;
  status: GameStatus;
  hostId: string; // hostClientId
}

export interface RoomJoinedEvent {
  roomId: string;
  status: GameStatus;
  hostId: string; // hostClientId
}

export interface PlayerListEvent {
  players: Record<string, Player>;
}

export interface RoundStartEvent {
  roundNumber: number;
  video: Video;
}

export interface RoundEndEvent {
  scores: Record<string, Player>;
  correctVideo: Video;
}

export interface GameOverEvent {
  finalScores: Record<string, Player>;
  leaderboard: Array<{ playerId: string; score: number }>;
}

export interface ErrorMessageEvent {
  message: string;
}

export interface StateSnapshotEvent extends Partial<GameState> {}

// Socket event names (for type safety)
export const SocketEvents = {
  // Client -> Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  START_GAME: 'start_game',
  SUBMIT_GUESS: 'submit_guess',
  END_ROUND: 'end_round',
  NEXT_ROUND: 'next_round',
  SYNC_STATE: 'sync_state',
  
  // Server -> Client
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  PLAYER_LIST: 'player_list',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  STATE_SNAPSHOT: 'state_snapshot',
  ERROR_MESSAGE: 'error_message',
} as const;
