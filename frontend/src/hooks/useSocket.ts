import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useGameState } from "../context/GameContext";

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

    s.on("room_created", game.onRoomCreated);
    s.on("room_joined", game.onRoomJoined);
    s.on("player_list", game.onPlayerList);
    s.on("round_start", game.onRoundStart);
    s.on("round_end", game.onRoundEnd);
    s.on("game_over", game.onGameOver);
    s.on("state_snapshot", game.onStateSnapshot);
    
    // Handle errors (room not found, game ended, etc.)
    s.on("error_message", ({ message }) => {
      console.error("Server error:", message);
      // If room not found or game ended, clear stale data
      if (message.includes("not found") || message.includes("ended")) {
        localStorage.removeItem("game_roomId");
        localStorage.removeItem("game_status");
        localStorage.removeItem("game_hostId");
        localStorage.removeItem("game_name");
        game.clearGameData();
      }
    });

    // Handle reconnection
    s.on("connect", () => {
      console.log("Socket connected, ID:", s.id);
      
      // If we're in a room, sync state and rejoin
      const savedRoomId = localStorage.getItem("game_roomId");
      const savedName = localStorage.getItem("game_name");
      const savedHostId = localStorage.getItem("game_hostId");
      
      if (savedRoomId && savedName) {
        const clientId = localStorage.getItem("game_clientId") || "";
        console.log("Reconnecting to room:", savedRoomId, "as", savedName);
        console.log("Old host ID:", savedHostId, "New socket ID:", s.id, "ClientID:", clientId);
        
        // Rejoin the room first (backend will validate if room still exists)
        s.emit("join_room", { roomId: savedRoomId, name: savedName, clientId });
        
        // Wait a bit for join to complete, then sync state
        setTimeout(() => {
          s.emit("sync_state", { roomId: savedRoomId });
        }, 100);
      }
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      s.off("room_created");
      s.off("room_joined");
      s.off("player_list");
      s.off("round_start");
      s.off("round_end");
      s.off("game_over");
      s.off("state_snapshot");
      s.off("error_message");
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
    createRoom: (name: string, numRounds: number) => {
      socket.emit("create_room", {
        name,
        clientId,
        rules: { rounds: numRounds },
      });
    },

    joinRoom: (roomId: string, name: string) => {
      socket.emit("join_room", { roomId, name, clientId });
    },

    startGame: (roomId: string) => {
      socket.emit("start_game", { roomId });
    },

    submitGuess: (roomId: string, guess: string) => {
      socket.emit("submit_guess", { roomId, guess });
    },

    endRound: (roomId: string) => {
      socket.emit("end_round", { roomId });
    },

    nextRound: (roomId: string) => {
      socket.emit("next_round", { roomId });
    },

    syncState: (roomId: string) => {
      socket.emit("sync_state", { roomId });
    },
  };
}
