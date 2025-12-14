
import express from "express";
import http from "http";
import { Server } from "socket.io";
import winston from "winston";
import fs from "fs";
import path from "path";

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
interface Sketch {
  id: string;
  name: string;
  youtubeId: string;
  description: string;
  tags: string[];
}

interface Room {
  roomId: string;
  hostId: string;
  status: string;
  rules: {
    rounds: number;
    maxWrongGuessesPerRound: number;
    segmentStartTime: number;
    segmentEndTime: number;
  };
  players: Record<string, { name: string; score: number; wrongGuessesThisRound: number }>;
  currentRound: number;
  currentSketch: Sketch | null;
  currentVideo: { url: string; startTime: number; endTime: number; name: string } | null;
  roundStartTime: number | null;
}

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
  socket.on("create_room", ({ name, rules }) => {
    logger.info(`SOCKET_EVENT: create_room by ${socket.id} with name=${name}`);
    const roomId = generateRoomId();
    rooms[roomId] = {
      roomId,
      hostId: socket.id,
      status: "lobby",
      rules: {
        rounds: rules.rounds || 3,
        maxWrongGuessesPerRound: rules.maxWrongGuessesPerRound || 3,
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
    rooms[roomId].players[socket.id] = { name, score: 0, wrongGuessesThisRound: 0 };

    socket.join(roomId);
    socket.emit("room_created", rooms[roomId]);
    io.to(roomId).emit("player_list", { players: rooms[roomId].players });
  });

  // --- Join Room ---
  socket.on("join_room", ({ roomId, name }) => {
    logger.info(`SOCKET_EVENT: join_room by ${socket.id} to room=${roomId} as name=${name}`);
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error_message", { message: "Room not found" });
      return;
    }

    room.players[socket.id] = { name, score: 0, wrongGuessesThisRound: 0 };
    socket.join(roomId);
    
    // Send the room status to the joining player
    socket.emit("room_joined", { roomId: room.roomId, status: room.status, hostId: room.hostId });
    
    // Notify all players in the room about updated player list
    io.to(roomId).emit("player_list", { players: room.players });
  });

  // --- Start Game ---
  socket.on("start_game", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: start_game by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;

    room.status = "playing";
    room.currentRound = 1;
    startRound(roomId);
  });

  // --- Submit Guess ---
  socket.on("submit_guess", ({ roomId, guess }) => {
    logger.info(`SOCKET_EVENT: submit_guess by ${socket.id} in room=${roomId} guess=${guess}`);
    const room = rooms[roomId];
    if (!room || room.status !== "playing") return;

    const player = room.players[socket.id];
    if (!player) return;

    if (player.wrongGuessesThisRound >= room.rules.maxWrongGuessesPerRound) return;

    if (!room.currentSketch || !room.currentVideo) return;
    const correctName = room.currentSketch.name;
    if (guess.trim().toLowerCase() === correctName.toLowerCase()) {
      if (room.roundStartTime === null) return;
      const timeDiff = Date.now() - room.roundStartTime;
      player.score += Math.max(1, Math.round(10000 / timeDiff)); // simple scoring example
      // Don't end the round automatically - let host end it
    } else {
      player.wrongGuessesThisRound += 1;
    }

    io.to(roomId).emit("player_list", { players: room.players });
  });

  // --- End Round (Host) ---
  socket.on("end_round", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: end_round by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;

    io.to(roomId).emit("round_end", {
      scores: room.players,
      correctVideo: room.currentVideo,
    });
  });

  // --- Next Round (Host) ---
  socket.on("next_round", ({ roomId }) => {
    logger.info(`SOCKET_EVENT: next_round by ${socket.id} for room=${roomId}`);
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;

    if (room.currentRound >= room.rules.rounds) {
      room.status = "ended";
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
        io.to(roomId).emit("player_list", { players: room.players });
        if (socket.id === room.hostId && Object.keys(room.players).length > 0) {
          // assign new host
          room.hostId = Object.keys(room.players)[0];
        }
      }
    }
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

  // Reset wrong guesses
  for (const playerId in room.players) {
    room.players[playerId].wrongGuessesThisRound = 0;
  }

  io.to(roomId).emit("round_start", {
    roundNumber: room.currentRound,
    video,
    maxWrongGuesses: room.rules.maxWrongGuessesPerRound,
  });
  io.to(roomId).emit("player_list", { players: room.players });
}

// --- Start Server ---
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});