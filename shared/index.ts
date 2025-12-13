// Shared types for Key & Peele Game

export type RoomStatus = 'lobby' | 'playing' | 'ended';

export interface Room {
  roomId: string;
  hostId: string;
  status: RoomStatus;
  rules: {
    rounds: number;
    segmentDurations: number[];
    maxWrongGuessesPerRound: number;
  };
  players: {
    [socketId: string]: {
      name: string;
      score: number;
      wrongGuessesThisRound: number;
      hasGuessedThisSegment: boolean;
    };
  };
  currentRound: number;
  currentVideoId: string;
  currentTimestamp: number;
  activeSegmentIndex: number;
  roundActive: boolean;
}

// Add more shared types as needed for events, payloads, etc.
