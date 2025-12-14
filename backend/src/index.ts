
import express from "express";
import http from "http";
import { Server } from "socket.io";
import winston from "winston";
import fs from "fs";
import path from "path";
import type { 
  Room, 
  Sketch, 
  GameRules, 
  Player,
  Video,
  CreateRoomPayload,
  JoinRoomPayload,
  GameStatus
} from "../../shared";

// Winston logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 4000;
logger.info(`Log level set to: ${logger.level}`);

// --- In-memory store ---
const rooms: Record<string, Room> = {}; // roomId -> room object

// Load sketches from shared directory
const sketchesPath = path.join(__dirname, "../../shared/sketches.json");
const sketches: Sketch[] = JSON.parse(fs.readFileSync(sketchesPath, "utf-8"));

// --- Helpers ---
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomSketch(): Sketch {
  return sketches[Math.floor(Math.random() * sketches.length)];
}

// --- Socket.IO ---
io.on("connection", (socket) => {
  logger.info(`SOCKET_CONNECT: User connected: ${socket.id}`);

  // --- Create Room ---
  socket.on("create_room", ({ name, clientId, rules }) => {
    logger.info(`SOCKET_EVENT: create_room by ${socket.id} with name=${name}, clientId=${clientId}`);
    const roomId = generateRoomId();
    rooms[roomId] = {
      roomId,
      hostId: socket.id,
      hostClientId: clientId,
      status: "lobby",
      rules: {
        rounds: rules.rounds || 3,
        segmentStartTime: rules.segmentStartTime || 0,
        segmentEndTime: rules.segmentEndTime || 10,
      },
      players: {},
      currentRound: 0,
      currentSketch: null,
      currentVideo: null,
      roundStartTime: null,
    };

    // Add host as first player
    rooms[roomId].players[socket.id] = { name, score: 0, clientId };

    socket.join(roomId);
    socket.emit("room_created", {
      roomId: rooms[roomId].roomId,
      status: rooms[roomId].status,
      hostId: rooms[roomId].hostClientId, // Send clientId, not socket.id
    });
    io.to(roomId).emit("player_list", { players: rooms[roomId].players });
  });

  // --- Join Room ---
  socket.on("join_room", ({ roomId, name, clientId }) => {
    logger.info(`SOCKET_EVENT: join_room by ${socket.id} to room=${roomId} as name=${name}, clientId=${clientId}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }
    
    // Don't allow joining finished games
    if (room.status === "game_over") {
      socket.emit("error_message", { message: "Game has ended" });
      return;
    }

    // Check if this is a reconnection (same clientId exists with different socket ID)
    let existingPlayer = null;
    let oldSocketId = null;
    for (const [id, player] of Object.entries(room.players)) {
      if (player.clientId === clientId && id !== socket.id) {
        existingPlayer = player;
        oldSocketId = id;
        break;
      }
    }

    if (existingPlayer && oldSocketId) {
      // Reconnection: preserve score and move to new socket ID
      logger.info(`RECONNECTION: ${name} (clientId: ${clientId}) from ${oldSocketId} to ${socket.id}`);
      room.players[socket.id] = existingPlayer;
      delete room.players[oldSocketId];
      
      // Update host socket ID if this was the host (check by clientId)
      if (room.hostClientId === clientId) {
        logger.info(`HOST RECONNECTION: Updating hostId from ${oldSocketId} to ${socket.id}`);
        room.hostId = socket.id;
      }
    } else {
      // New player
      room.players[socket.id] = { name, score: 0, clientId };
    }
    
    socket.join(roomId);
    
    // Send the room status to the joining player
    socket.emit("room_joined", {
      roomId: room.roomId,
      status: room.status,
      hostId: room.hostClientId, // Send clientId, not socket.id
    });
    
    // Notify all players in the room about updated player list
    io.to(roomId).emit("player_list", { players: room.players });
  });

  // --- Start Game ---
  socket.on("start_game", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: start_game by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }
    
    if (room.status === "game_over") {
      socket.emit("error_message", { message: "Game has ended" });
      return;
    }
    
    const player = room?.players[socket.id];
    if (!player || player.clientId !== room.hostClientId) {
      logger.warn(`Unauthorized start_game attempt by ${socket.id}`);
      return;
    }

    room.status = "round";
    room.currentRound = 1;
    startRound(roomId);
  });

  // --- Submit Guess ---
  socket.on("submit_guess", ({ roomId, guess }) => {
    logger.info(`SOCKET_EVENT: submit_guess by ${socket.id} in room=${roomId} guess=${guess}`);
    const room = rooms[roomId];
    if (!room || room.status === "game_over") return;
    if (room.status !== "round") return;

    const player = room.players[socket.id];
    if (!player) return;

    if (!room.currentSketch || !room.currentVideo) return;
    const correctName = room.currentSketch.name;
    if (guess.trim().toLowerCase() === correctName.toLowerCase()) {
      if (room.roundStartTime === null) return;
      const timeDiff = Date.now() - room.roundStartTime;
      player.score += Math.max(1, Math.round(10000 / timeDiff)); // simple scoring example
      // Don't end the round automatically - let host end it
    }

    io.to(roomId).emit("player_list", { players: room.players });
  });

  // --- End Round (Host) ---
  socket.on("end_round", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: end_round by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }
    
    if (room.status === "game_over") {
      socket.emit("error_message", { message: "Game has ended" });
      return;
    }
    
    const player = room?.players[socket.id];
    if (!player || player.clientId !== room.hostClientId) {
      logger.warn(`Unauthorized end_round attempt by ${socket.id}`);
      return;
    }

    io.to(roomId).emit("round_end", {
      scores: room.players,
      correctVideo: room.currentVideo,
    });
  });

  // --- Next Round (Host) ---
  socket.on("next_round", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: next_round by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }
    
    if (room.status === "game_over") {
      socket.emit("error_message", { message: "Game has ended" });
      return;
    }
    
    const player = room?.players[socket.id];
    if (!player || player.clientId !== room.hostClientId) {
      logger.warn(`Unauthorized next_round attempt by ${socket.id}`);
      return;
    }

    if (room.currentRound >= room.rules.rounds) {
      room.status = "game_over";
      io.to(roomId).emit("game_over", {
        finalScores: room.players,
        leaderboard: Object.entries(room.players)
          .map(([id, p]) => ({ playerId: id, score: p.score }))
          .sort((a, b) => b.score - a.score),
      });
    } else {
      room.currentRound += 1;
      startRound(roomId);
    }
  });

  socket.on("disconnect", () => {
    logger.info(`SOCKET_DISCONNECT: User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
          logger.info(`Room ${roomId} deleted due to all players leaving`);
          return;
        }
        io.to(roomId).emit("player_list", { players: room.players });
        if (socket.id === room.hostId && Object.keys(room.players).length > 0) {
          // assign new host
          room.hostId = Object.keys(room.players)[0];
        }
      }
    }
  });

  // --- Sync State (for reconnect/refresh) ---
  socket.on("sync_state", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: sync_state by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }
    
    // Don't allow reconnecting to finished games
    if (room.status === "game_over") {
      socket.emit("error_message", { message: "Game has ended" });
      return;
    }

    // Send complete state snapshot
    socket.emit("state_snapshot", {
      status: room.status,
      roomId: room.roomId,
      hostId: room.hostClientId, // Send clientId, not socket.id
      players: room.players,
      round: room.currentRound,
      video: room.currentVideo,
      scores: room.players, // Scores are part of players
    });
  });
});

// --- Start a Round ---
function startRound(roomId: string) {
  const room = rooms[roomId];
  const sketch = getRandomSketch();
  room.currentSketch = sketch;
  
  // Construct video object with embed URL and segment timing
  const video = {
    url: `https://www.youtube.com/embed/${sketch.youtubeId}`,
    startTime: room.rules.segmentStartTime,
    endTime: room.rules.segmentEndTime,
    name: sketch.name,
  };
  room.currentVideo = video;
  room.roundStartTime = Date.now();

  io.to(roomId).emit("round_start", {
    roundNumber: room.currentRound,
    video,
  });
  io.to(roomId).emit("player_list", { players: room.players });
}

// --- Start Server ---
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});