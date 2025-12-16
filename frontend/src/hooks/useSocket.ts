import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useGameState } from "../context/GameContext";
import type { GameRules } from "../../../shared";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:4000");
  }
  return socket;
}

export function useSocket() {
  const game = useGameState();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    const s = socketRef.current;

    // Kahoot pattern: both host and players get "room_joined"
    s.on("room_joined", game.onRoomJoined);
    s.on("player_list", game.onPlayerList);
    s.on("round_start", game.onRoundStart);
    s.on("round_end", game.onRoundEnd);
    s.on("game_over", game.onGameOver);
    s.on("state_snapshot", game.onStateSnapshot);
    s.on("timer_update", game.onTimerUpdate);
    s.on("host_disconnected", game.onHostDisconnected);
    s.on("host_reconnected", game.onHostReconnected);
    s.on("game_ended", game.onGameEnded);
    
    // Handle errors
    s.on("error_message", ({ message }) => {
      console.error("Server error:", message);
      // If room not found or game ended, clear stale data
      if (message.includes("not found") || message.includes("ended")) {
        game.clearGameData();
      }
    });

    // Handle guess submission confirmation
    s.on("guess_submitted", ({ message }) => {
      console.log(message);
    });

    // Handle reconnection
    s.on("connect", () => {
      console.log("Socket connected, ID:", s.id);
      
      // If we're in a game, sync state and rejoin
      const savedGameId = localStorage.getItem("game_gameId");
      const savedName = localStorage.getItem("game_name");
      const savedPin = localStorage.getItem("game_pin");
      const savedHostId = localStorage.getItem("game_hostId");
      const clientId = localStorage.getItem("game_clientId") || "";
      
      if (savedGameId && savedName && savedPin) {
        console.log("Reconnecting to game:", savedGameId, "as", savedName);
        
        // Check if we're the host or a player
        const isHost = clientId === savedHostId;
        
        if (isHost) {
          // Rejoin as host
          s.emit("host:join", { gameId: savedGameId, clientId });
        } else {
          // Rejoin as player with PIN
          s.emit("player:join", { pin: savedPin, name: savedName, clientId });
        }
        
        // Wait a bit for join to complete, then sync state
        setTimeout(() => {
          s.emit("sync_state", { gameId: savedGameId });
        }, 100);
      }
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      s.off("room_joined");
      s.off("player_list");
      s.off("round_start");
      s.off("round_end");
      s.off("game_over");
      s.off("state_snapshot");
      s.off("error_message");
      s.off("guess_submitted");
      s.off("timer_update");
      s.off("host_disconnected");
      s.off("host_reconnected");
      s.off("game_ended");
      s.off("connect");
      s.off("disconnect");
    };
  }, [game]);

  return socketRef.current;
}

export function useSocketActions() {
  const socket = getSocket();
  const clientId = localStorage.getItem("game_clientId") || "";

  return {
    // Kahoot pattern: HTTP POST then socket join
    createRoom: async (name: string, rules: GameRules) => {
      try {
        // Step 1: Create room via HTTP POST
        const response = await fetch("http://localhost:4000/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, clientId, rules }),
        });

        if (!response.ok) {
          throw new Error("Failed to create room");
        }

        const { gameId, pin } = await response.json();
        console.log("Room created via HTTP:", { gameId, pin });

        // Step 2: Join as host via socket
        socket.emit("host:join", { gameId, clientId });
      } catch (error) {
        console.error("Error creating room:", error);
        throw error;
      }
    },

    // Player joins with PIN
    joinRoom: (pin: string, name: string) => {
      socket.emit("player:join", { pin, name, clientId });
    },

    startGame: (gameId: string) => {
      socket.emit("start_game", { gameId });
    },

    submitGuess: (gameId: string, guess: string) => {
      socket.emit("submit_guess", { gameId, guess });
    },

    endRound: (gameId: string) => {
      socket.emit("end_round", { gameId });
    },

    nextRound: (gameId: string) => {
      socket.emit("next_round", { gameId });
    },

    skipTimer: (gameId: string) => {
      socket.emit("skip_timer", { gameId });
    },

    leaveGame: (gameId: string) => {
      socket.emit("leave_game", { gameId });
    },

    syncState: (gameId: string) => {
      socket.emit("sync_state", { gameId });
    },
  };
}
