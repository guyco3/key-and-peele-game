// Shared types for Key & Peele Game

// Game status constants
export type GameStatus = 'landing' | 'lobby' | 'round' | 'round_end' | 'game_over';

// Player interface
export interface Player {
  name: string;
  score: number;
  clientId: string;
  isConnected?: boolean;
  lastGuess?: string;
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

// Guess interface
export interface Guess {
  playerId: string;
  playerName: string;
  guess: string;
  timestamp: number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

// Timer state
export interface TimerState {
  type: 'round' | 'round_end' | null;
  startTime: number;
  duration: number; // in seconds
  remainingTime?: number; // in seconds
}

// Game rules
export interface GameRules {
  rounds: number;
  segmentStartTime: number;
  segmentEndTime: number;
  autoProgress: boolean;
  roundLength: number; // in seconds (5-60)
  roundEndLength: number; // in seconds (5-60)
  selectedSketches: Sketch[]; // empty array means random selection
}

// Room interface (backend)
export interface Room {
  gameId: string; // UUID
  pin: string; // 6-character alphanumeric PIN
  hostId: string; // socket.id of host (can change)
  hostClientId: string; // persistent clientId of host
  hostDisconnectedAt: number | null; // timestamp when host disconnected
  status: GameStatus;
  rules: GameRules;
  players: Record<string, Player>;
  currentRound: number;
  currentSketch: Sketch | null;
  currentVideo: Video | null;
  roundStartTime: number | null;
  roundEndTime: number | null;
  timerState: TimerState;
  createdAt: number;
  lastActivityAt: number;
}

// Game state (frontend)
export interface GameState {
  status: GameStatus;
  gameId: string; // UUID, stored in localStorage
  pin: string; // Display PIN for users to join
  hostId: string; // This is hostClientId from backend
  name: string;
  clientId: string;
  players: Record<string, Player>;
  round: number;
  video: Video | null;
  scores: Record<string, Player>;
  numRounds: number;
  gameRules: GameRules | null;
  timerState: TimerState;
  hostDisconnected: boolean;
  isReconnecting: boolean;
}

// Socket event payloads
export interface CreateRoomPayload {
  name: string;
  clientId: string;
  rules: GameRules;
}

export interface JoinRoomPayload {
  pin: string; // User joins with PIN, not gameId
  name: string;
  clientId: string;
}

export interface RoomCreatedEvent {
  gameId: string;
  pin: string;
  status: GameStatus;
  hostId: string; // hostClientId
}

export interface RoomJoinedEvent {
  gameId: string;
  pin: string;
  status: GameStatus;
  hostId: string; // hostClientId
}

export interface PlayerListEvent {
  players: Record<string, Player>;
}

export interface RoundStartEvent {
  roundNumber: number;
  video: Video;
  timerState: TimerState;
}

export interface RoundEndEvent {
  scores: Record<string, Player>;
  correctVideo: Video;
  results: Guess[]; // Individual player results with correctness
  timerState: TimerState;
}

export interface GameOverEvent {
  finalScores: Record<string, Player>;
  leaderboard: Array<{ playerId: string; playerName: string; score: number }>;
}

export interface TimerUpdateEvent {
  timerState: TimerState;
}

export interface HostDisconnectedEvent {
  message: string;
  disconnectedAt: number;
}

export interface HostReconnectedEvent {
  message: string;
}

export interface GameEndedEvent {
  reason: string;
  message: string;
}

export interface ErrorMessageEvent {
  message: string;
}

export interface StateSnapshotEvent {
  status: GameStatus;
  gameId: string;
  pin: string;
  hostId: string;
  players: Record<string, Player>;
  round: number;
  video: Video | null;
  scores: Record<string, Player>;
  gameRules: GameRules;
  timerState: TimerState;
  hostDisconnected: boolean;
}

// Socket event names (for type safety)
export const SocketEvents = {
  // Client -> Server (Kahoot Pattern)
  HOST_JOIN: 'host:join',          // Host joins after HTTP POST
  PLAYER_JOIN: 'player:join',      // Player joins with PIN
  START_GAME: 'start_game',
  SUBMIT_GUESS: 'submit_guess',
  END_ROUND: 'end_round',
  NEXT_ROUND: 'next_round',
  SYNC_STATE: 'sync_state',
  LEAVE_GAME: 'leave_game',
  SKIP_TIMER: 'skip_timer',
  
  // Server -> Client
  ROOM_JOINED: 'room_joined',      // Used for both host and player
  PLAYER_LIST: 'player_list',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  STATE_SNAPSHOT: 'state_snapshot',
  ERROR_MESSAGE: 'error_message',
  TIMER_UPDATE: 'timer_update',
  HOST_DISCONNECTED: 'host_disconnected',
  HOST_RECONNECTED: 'host_reconnected',
  GAME_ENDED: 'game_ended',
  GUESS_SUBMITTED: 'guess_submitted',
} as const;
