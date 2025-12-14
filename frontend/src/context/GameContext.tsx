import React, { createContext, useContext, useState, ReactNode } from "react";
import type { GameState, Player, Video, GameStatus } from "../../../shared";

// Re-export shared types for convenience
export type { Player, Video, GameState, GameStatus };

export interface GameContextValue extends GameState {
  setStatus: (status: GameStatus) => void;
  setRoomId: (roomId: string) => void;
  setHostId: (hostId: string) => void;
  setName: (name: string) => void;
  setPlayers: (players: Record<string, Player>) => void;
  setRound: (round: number) => void;
  setVideo: (video: Video | null) => void;
  setScores: (scores: Record<string, Player>) => void;
  setNumRounds: (numRounds: number) => void;
  
  // Event handlers
  onRoomCreated: (data: { roomId: string; status: GameStatus; hostId: string }) => void;
  onRoomJoined: (data: { roomId: string; status: GameStatus; hostId: string }) => void;
  onPlayerList: (data: { players: Record<string, Player> }) => void;
  onRoundStart: (data: { roundNumber: number; video: Video }) => void;
  onRoundEnd: (data: { scores: Record<string, Player>; correctVideo: Video }) => void;
  onGameOver: () => void;
  onStateSnapshot: (state: Partial<GameState>) => void;
  clearGameData: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// Generate or retrieve persistent client ID
function getOrCreateClientId(): string {
  let clientId = localStorage.getItem("game_clientId");
  if (!clientId) {
    clientId = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    localStorage.setItem("game_clientId", clientId);
  }
  return clientId;
}

export function GameProvider({ children }: { children: ReactNode }) {
  // Load from localStorage on mount
  const [status, setStatus] = useState<GameStatus>(() => {
    const saved = localStorage.getItem("game_status");
    // Migrate old "playing" status to "round"
    if (saved === "playing") {
      localStorage.setItem("game_status", "round");
      return "round";
    }
    return (saved as GameStatus) || "landing";
  });
  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem("game_roomId") || "";
  });
  const [hostId, setHostId] = useState(() => {
    return localStorage.getItem("game_hostId") || "";
  });
  const [name, setName] = useState(() => {
    return localStorage.getItem("game_name") || "";
  });
  
  // Get or create persistent client ID
  const clientId = getOrCreateClientId();
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [round, setRound] = useState(0);
  const [video, setVideo] = useState<Video | null>(null);
  const [scores, setScores] = useState<Record<string, Player>>({});
  const [numRounds, setNumRounds] = useState(3);

  const onRoomCreated = ({ roomId, status, hostId }: { roomId: string; status: GameStatus; hostId: string }) => {
    console.log("Room created - hostId (clientId):", hostId);
    setRoomId(roomId);
    setStatus(status);
    // hostId from backend is now hostClientId
    setHostId(hostId);
    // Persist to localStorage
    localStorage.setItem("game_roomId", roomId);
    localStorage.setItem("game_status", status);
    localStorage.setItem("game_hostId", hostId);
  };

  const onRoomJoined = ({ roomId, status, hostId }: { roomId: string; status: GameStatus; hostId: string }) => {
    console.log("Room joined - hostId (clientId):", hostId);
    setRoomId(roomId);
    setStatus(status);
    setHostId(hostId);
    // Persist to localStorage
    localStorage.setItem("game_roomId", roomId);
    localStorage.setItem("game_status", status);
    localStorage.setItem("game_hostId", hostId);
  };

  const onPlayerList = ({ players }: { players: Record<string, Player> }) => {
    setPlayers(players);
  };

  const onRoundStart = ({ roundNumber, video }: { roundNumber: number; video: Video }) => {
    setRound(roundNumber);
    setVideo(video);
    setStatus("round");
  };

  const onRoundEnd = ({ scores, correctVideo }: { scores: Record<string, Player>; correctVideo: Video }) => {
    setScores(scores);
    setVideo(correctVideo);
    setStatus("round_end");
  };

  const onGameOver = () => {
    setStatus("game_over");
    // Clear room data when game ends - don't persist finished games
    localStorage.removeItem("game_roomId");
    localStorage.removeItem("game_status");
    localStorage.removeItem("game_hostId");
    localStorage.removeItem("game_name");
    // Keep game_clientId for next game
  };

  const clearGameData = () => {
    setStatus("landing");
    setRoomId("");
    setHostId("");
    setPlayers({});
    setRound(0);
    setVideo(null);
    setScores({});
    // Clear localStorage (keep clientId for next game)
    localStorage.removeItem("game_roomId");
    localStorage.removeItem("game_status");
    localStorage.removeItem("game_hostId");
    localStorage.removeItem("game_name");
  };

  const onStateSnapshot = (state: Partial<GameState>) => {
    console.log("Received state snapshot:", state);
    if (state.status !== undefined) {
      setStatus(state.status);
      // If game is over, clear room data
      if (state.status === "game_over") {
        localStorage.removeItem("game_roomId");
        localStorage.removeItem("game_status");
        localStorage.removeItem("game_hostId");
        localStorage.removeItem("game_name");
      } else {
        localStorage.setItem("game_status", state.status);
      }
    }
    if (state.roomId !== undefined) {
      setRoomId(state.roomId);
      localStorage.setItem("game_roomId", state.roomId);
    }
    if (state.hostId !== undefined) {
      console.log("Updating hostId to:", state.hostId);
      setHostId(state.hostId);
      localStorage.setItem("game_hostId", state.hostId);
    }
    if (state.players !== undefined) setPlayers(state.players);
    if (state.round !== undefined) setRound(state.round);
    if (state.video !== undefined) setVideo(state.video);
    if (state.scores !== undefined) setScores(state.scores);
  };

  const value: GameContextValue = {
    status,
    roomId,
    hostId,
    name,
    clientId,
    players,
    round,
    video,
    scores,
    numRounds,
    setStatus: (s: GameStatus) => {
      setStatus(s);
      localStorage.setItem("game_status", s);
    },
    setRoomId: (r: string) => {
      setRoomId(r);
      if (r) localStorage.setItem("game_roomId", r);
      else localStorage.removeItem("game_roomId");
    },
    setHostId: (h: string) => {
      setHostId(h);
      if (h) localStorage.setItem("game_hostId", h);
    },
    setName: (n: string) => {
      setName(n);
      if (n) localStorage.setItem("game_name", n);
    },
    setPlayers,
    setRound,
    setVideo,
    setScores,
    setNumRounds,
    onRoomCreated,
    onRoomJoined,
    onPlayerList,
    onRoundStart,
    onRoundEnd,
    onGameOver,
    onStateSnapshot,
    clearGameData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameState must be used within GameProvider");
  }
  return context;
}
