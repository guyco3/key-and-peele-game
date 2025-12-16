import React, { createContext, useContext, useState, ReactNode } from "react";
import type { GameState, Player, Video, GameStatus, TimerState, Sketch, GameRules } from "../../../shared";

// Re-export shared types for convenience
export type { Player, Video, GameState, GameStatus, Sketch, GameRules };

export interface GameContextValue extends GameState {
  setStatus: (status: GameStatus) => void;
  setGameId: (gameId: string) => void;
  setPin: (pin: string) => void;
  setHostId: (hostId: string) => void;
  setName: (name: string) => void;
  setPlayers: (players: Record<string, Player>) => void;
  setRound: (round: number) => void;
  setVideo: (video: Video | null) => void;
  setScores: (scores: Record<string, Player>) => void;
  setNumRounds: (numRounds: number) => void;
  setGameRules: (rules: GameRules | null) => void;
  setTimerState: (timerState: TimerState) => void;
  setHostDisconnected: (disconnected: boolean) => void;
  setIsReconnecting: (reconnecting: boolean) => void;
  
  // Event handlers (Kahoot pattern: both host and player use onRoomJoined)
  onRoomJoined: (data: { gameId: string; pin: string; status: GameStatus; hostId: string; gameRules?: GameRules; isReconnecting?: boolean }) => void;
  onPlayerList: (data: { players: Record<string, Player> }) => void;
  onRoundStart: (data: { roundNumber: number; video: Video; timerState: TimerState }) => void;
  onRoundEnd: (data: { scores: Record<string, Player>; correctVideo: Video; timerState: TimerState }) => void;
  onGameOver: () => void;
  onTimerUpdate: (data: { timerState: TimerState }) => void;
  onHostDisconnected: () => void;
  onHostReconnected: () => void;
  onGameEnded: () => void;
  onStateSnapshot: (state: any) => void;
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
    return (saved as GameStatus) || "landing";
  });
  const [gameId, setGameId] = useState(() => {
    return localStorage.getItem("game_gameId") || "";
  });
  const [pin, setPin] = useState(() => {
    return localStorage.getItem("game_pin") || "";
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
  const [gameRules, setGameRules] = useState<GameRules | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    type: null,
    startTime: 0,
    duration: 0,
  });
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Kahoot pattern: same handler for both host and player
  const onRoomJoined = ({ gameId, pin, status, hostId, gameRules: rules, isReconnecting: wasReconnecting }: { gameId: string; pin: string; status: GameStatus; hostId: string; gameRules?: GameRules; isReconnecting?: boolean }) => {
    console.log("Room joined - gameId:", gameId, "pin:", pin, "hostId:", hostId, "gameRules:", rules);
    setGameId(gameId);
    setPin(pin);
    setStatus(status);
    setHostId(hostId);
    
    // Set game rules if provided
    if (rules) {
      setGameRules(rules);
      localStorage.setItem("game_rules", JSON.stringify(rules));
    }
    
    if (wasReconnecting) {
      setIsReconnecting(true);
      setTimeout(() => setIsReconnecting(false), 4000);
    }
    
    // Persist to localStorage
    localStorage.setItem("game_gameId", gameId);
    localStorage.setItem("game_pin", pin);
    localStorage.setItem("game_status", status);
    localStorage.setItem("game_hostId", hostId);
  };

  const onPlayerList = ({ players }: { players: Record<string, Player> }) => {
    setPlayers(players);
  };

  const onRoundStart = ({ roundNumber, video, timerState }: { roundNumber: number; video: Video; timerState: TimerState }) => {
    setRound(roundNumber);
    setVideo(video);
    setStatus("round");
    setTimerState(timerState);
    localStorage.setItem("game_status", "round");
  };

  const onRoundEnd = ({ scores, correctVideo, timerState }: { scores: Record<string, Player>; correctVideo: Video; timerState: TimerState }) => {
    setScores(scores);
    setPlayers(scores); // Update players with new scores
    setVideo(correctVideo);
    setStatus("round_end");
    setTimerState(timerState);
    localStorage.setItem("game_status", "round_end");
  };

  const onGameOver = () => {
    setStatus("game_over");
    setTimerState({ type: null, startTime: 0, duration: 0 });
    localStorage.setItem("game_status", "game_over");
    // Clear room data when game ends
    setTimeout(() => {
      localStorage.removeItem("game_gameId");
      localStorage.removeItem("game_pin");
      localStorage.removeItem("game_status");
      localStorage.removeItem("game_hostId");
      localStorage.removeItem("game_name");
    }, 5000); // Give time to see final screen
  };

  const onTimerUpdate = ({ timerState }: { timerState: TimerState }) => {
    setTimerState(timerState);
  };

  const onHostDisconnected = () => {
    setHostDisconnected(true);
  };

  const onHostReconnected = () => {
    setHostDisconnected(false);
  };

  const onGameEnded = () => {
    setStatus("landing");
    clearGameData();
  };

  const clearGameData = () => {
    setStatus("landing");
    setGameId("");
    setPin("");
    setHostId("");
    setPlayers({});
    setRound(0);
    setVideo(null);
    setScores({});
    setGameRules(null);
    setTimerState({ type: null, startTime: 0, duration: 0 });
    setHostDisconnected(false);
    // Clear localStorage (keep clientId for next game)
    localStorage.removeItem("game_gameId");
    localStorage.removeItem("game_pin");
    localStorage.removeItem("game_status");
    localStorage.removeItem("game_hostId");
    localStorage.removeItem("game_name");
  };

  const onStateSnapshot = (state: any) => {
    console.log("Received state snapshot:", state);
    if (state.status !== undefined) {
      setStatus(state.status);
      localStorage.setItem("game_status", state.status);
    }
    if (state.gameId !== undefined) {
      setGameId(state.gameId);
      localStorage.setItem("game_gameId", state.gameId);
    }
    if (state.pin !== undefined) {
      setPin(state.pin);
      localStorage.setItem("game_pin", state.pin);
    }
    if (state.hostId !== undefined) {
      setHostId(state.hostId);
      localStorage.setItem("game_hostId", state.hostId);
    }
    if (state.players !== undefined) setPlayers(state.players);
    if (state.round !== undefined) setRound(state.round);
    if (state.video !== undefined) setVideo(state.video);
    if (state.scores !== undefined) setScores(state.scores);
    if (state.gameRules !== undefined) setGameRules(state.gameRules);
    if (state.timerState !== undefined) setTimerState(state.timerState);
    if (state.hostDisconnected !== undefined) setHostDisconnected(state.hostDisconnected);
  };

  const value: GameContextValue = {
    status,
    gameId,
    pin,
    hostId,
    name,
    clientId,
    players,
    round,
    video,
    scores,
    numRounds,
    gameRules,
    timerState,
    hostDisconnected,
    isReconnecting,
    setStatus: (s: GameStatus) => {
      setStatus(s);
      localStorage.setItem("game_status", s);
    },
    setGameId: (g: string) => {
      setGameId(g);
      if (g) localStorage.setItem("game_gameId", g);
      else localStorage.removeItem("game_gameId");
    },
    setPin: (p: string) => {
      setPin(p);
      if (p) localStorage.setItem("game_pin", p);
      else localStorage.removeItem("game_pin");
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
    setGameRules,
    setTimerState,
    setHostDisconnected,
    setIsReconnecting,
    onRoomJoined,
    onPlayerList,
    onRoundStart,
    onRoundEnd,
    onGameOver,
    onTimerUpdate,
    onHostDisconnected,
    onHostReconnected,
    onGameEnded,
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
