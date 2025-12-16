import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as Redis from "./services/redis.service";
import cors from "cors";
import { createClient } from "redis";
import fs from "fs";
import path from "path";
import type { Sketch, SocketEvents } from "../../shared";

async function main() {
  const app = express();
  const server = http.createServer(app);

  app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }));

  const io = new Server(server, { cors: { origin: "*" } });

  app.use(express.json());
  
  // Redis client for socket operations
  const client = createClient();
  await client.connect();
  
  // Load sketches from shared directory
  const sketchesPath = path.join(__dirname, "../../shared/sketches.json");
  const sketches: Sketch[] = JSON.parse(fs.readFileSync(sketchesPath, "utf-8"));
  
  // Helper function to get random sketch
  function getRandomSketch(): Sketch {
    return sketches[Math.floor(Math.random() * sketches.length)];
  }

  try {
    await Redis.initRedis();
    console.log("✅ Redis initialized, starting server...");
  } catch (err) {
    console.error("❌ Redis init failed:", err);
  }
  console.log("✅ Redis initialized, starting server...");

  /* ---------- HTTP ---------- */
  app.post("/api/games", async (req, res) => {
    try {
      const { name, clientId, rules } = req.body;
      
      if (!name || !clientId || !rules) {
        return res.status(400).json({ error: "Missing required fields: name, clientId, rules" });
      }

      const game = await Redis.createGame(clientId, name, rules);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  /* ---------- SOCKETS ---------- */
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Host joins after creating room via HTTP
    socket.on("host:join", async ({ gameId, clientId }) => {
      try {
        console.log(`Host ${clientId} joining game ${gameId}`);
        
        // Verify the host
        const meta = await Redis.getMeta(gameId);
        if (!meta.gameId || meta.hostClientId !== clientId) {
          socket.emit("error_message", { message: "Unauthorized host join" });
          return;
        }

        await Redis.bindSocketToGame(socket.id, gameId);
        socket.join(gameId);

        // Update host player entry with socket ID
        const players = await Redis.getPlayers(gameId);
        const hostPlayer = Object.values(players).find(p => p.clientId === clientId);
        
        if (hostPlayer) {
          // Remove old player entry and add with new socket ID
          await client.hDel(`game:${gameId}:players`, "pending");
          await client.hSet(`game:${gameId}:players`, socket.id, JSON.stringify(hostPlayer));
        }

        const rules = await Redis.getRules(gameId);

        socket.emit("room_joined", {
          gameId: meta.gameId,
          pin: meta.pin,
          status: meta.status,
          hostId: meta.hostClientId,
          gameRules: rules,
        });

        const updatedPlayers = await Redis.getPlayers(gameId);
        io.to(gameId).emit("player_list", { players: updatedPlayers });

      } catch (error) {
        console.error("Error in host:join:", error);
        socket.emit("error_message", { message: "Failed to join as host" });
      }
    });

    // Player joins with PIN
    socket.on("player:join", async ({ pin, name, clientId }) => {
      try {
        console.log(`Player ${name} (${clientId}) joining with pin ${pin}`);
        
        const gameId = await Redis.getGameIdByPin(pin);
        if (!gameId) {
          socket.emit("error_message", { message: "Invalid pin" });
          return;
        }

        const meta = await Redis.getMeta(gameId);
        if (!meta.gameId) {
          socket.emit("error_message", { message: "Game not found" });
          return;
        }

        // Don't allow joining finished games
        if (meta.status === "game_over") {
          socket.emit("error_message", { message: "Game has ended" });
          return;
        }

        await Redis.bindSocketToGame(socket.id, gameId);
        socket.join(gameId);

        // Add player
        const newPlayer = { name, clientId, score: 0 };
        await client.hSet(`game:${gameId}:players`, socket.id, JSON.stringify(newPlayer));

        const rules = await Redis.getRules(gameId);

        socket.emit("room_joined", {
          gameId: gameId,
          pin: meta.pin,
          status: meta.status,
          hostId: meta.hostClientId,
          gameRules: rules,
        });

        const players = await Redis.getPlayers(gameId);
        io.to(gameId).emit("player_list", { players });

      } catch (error) {
        console.error("Error in player:join:", error);
        socket.emit("error_message", { message: "Failed to join game" });
      }
    });

    socket.on("start_game", async ({ gameId }) => {
      try {
        console.log(`START_GAME event received for gameId: ${gameId} by socket: ${socket.id}`);
        
        const meta = await Redis.getMeta(gameId);
        console.log(`Game meta:`, meta);
        
        if (!meta.gameId) {
          console.log("Game not found");
          socket.emit("error_message", { message: "Game not found" });
          return;
        }
        
        if (meta.status !== "lobby") {
          console.log(`Game status is ${meta.status}, not lobby`);
          socket.emit("error_message", { message: "Game already started" });
          return;
        }

        // Check if socket is the host
        if (meta.hostClientId) {
          const players = await Redis.getPlayers(gameId);
          const hostPlayer = Object.entries(players).find(([socketId, player]) => player.clientId === meta.hostClientId);
          if (!hostPlayer || hostPlayer[0] !== socket.id) {
            console.log(`Unauthorized start attempt by ${socket.id}, host is ${hostPlayer?.[0]}`);
            socket.emit("error_message", { message: "Only host can start the game" });
            return;
          }
        }

        console.log("Starting game...");
        await Redis.setStatus(gameId, "round");
        await Redis.incrementRound(gameId);
        await Redis.startTimer(gameId, "round");
        
        // Get updated meta after incrementing round
        const updatedMeta = await Redis.getMeta(gameId);
        const rules = await Redis.getRules(gameId);
        
        // Select a video for this round
        const selectedSketch = getRandomSketch();
        const video = {
          url: `https://www.youtube.com/embed/${selectedSketch.youtubeId}`,
          startTime: rules?.segmentStartTime || 0,
          endTime: rules?.segmentEndTime || 10,
          name: selectedSketch.name
        };
        
        console.log(`Emitting round_start to room ${gameId}`);
        io.to(gameId).emit("round_start", {
          roundNumber: parseInt(updatedMeta.round),
          video: video,
          timerState: {
            type: 'round',
            startTime: Date.now(),
            duration: rules?.roundLength || 30
          }
        });
      } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("error_message", { message: "Failed to start game" });
      }
    });

    socket.on("submit_guess", async ({ gameId, guess }) => {
      try {
        const meta = await Redis.getMeta(gameId);
        const round = parseInt(meta.round);
        
        await Redis.storeGuess(gameId, round, socket.id, {
          playerId: socket.id,
          playerName: "", // You might want to get this from players
          guess,
          timestamp: Date.now()
        });

        // Optionally notify other players that a guess was submitted
        socket.to(gameId).emit("guess_submitted", { playerId: socket.id });
      } catch (error) {
        console.error("Error submitting guess:", error);
        socket.emit("error_message", { message: "Failed to submit guess" });
      }
    });

    socket.on("end_round", async ({ gameId }) => {
      try {
        console.log(`END_ROUND event received for gameId: ${gameId} by socket: ${socket.id}`);
        
        const meta = await Redis.getMeta(gameId);
        if (meta.status !== "round") {
          socket.emit("error_message", { message: "Not in a round" });
          return;
        }

        // Verify host permission
        const players = await Redis.getPlayers(gameId);
        const hostPlayer = Object.entries(players).find(([socketId, player]) => player.clientId === meta.hostClientId);
        if (!hostPlayer || hostPlayer[0] !== socket.id) {
          socket.emit("error_message", { message: "Only host can end round" });
          return;
        }

        // Clear current timer and transition to round_end
        await Redis.clearTimer(gameId, "round");
        await Redis.setStatus(gameId, "round_end");
        
        const rules = await Redis.getRules(gameId);
        if (rules?.autoProgress) {
          await Redis.startTimer(gameId, "round_end");
        }
        
        io.to(gameId).emit("round_end", {
          scores: players,
          correctVideo: null, // You might want to store the correct video
          timerState: {
            type: 'round_end',
            startTime: Date.now(),
            duration: rules?.roundEndLength || 10
          }
        });
      } catch (error) {
        console.error("Error ending round:", error);
        socket.emit("error_message", { message: "Failed to end round" });
      }
    });

    socket.on("next_round", async ({ gameId }) => {
      try {
        console.log(`NEXT_ROUND event received for gameId: ${gameId} by socket: ${socket.id}`);
        
        const meta = await Redis.getMeta(gameId);
        if (meta.status !== "round_end") {
          socket.emit("error_message", { message: "Not in round end state" });
          return;
        }

        // Verify host permission
        const players = await Redis.getPlayers(gameId);
        const hostPlayer = Object.entries(players).find(([socketId, player]) => player.clientId === meta.hostClientId);
        if (!hostPlayer || hostPlayer[0] !== socket.id) {
          socket.emit("error_message", { message: "Only host can start next round" });
          return;
        }

        const rules = await Redis.getRules(gameId);
        const currentRound = parseInt(meta.round);
        
        // Check if we should start next round or end game
        if (currentRound < (rules?.rounds || 3)) {
          // Clear timer and start next round
          await Redis.clearTimer(gameId, "round_end");
          await Redis.setStatus(gameId, "round");
          await Redis.incrementRound(gameId);
          await Redis.startTimer(gameId, "round");
          
          // Select a video for next round
          const selectedSketch = getRandomSketch();
          const video = {
            url: `https://www.youtube.com/embed/${selectedSketch.youtubeId}`,
            startTime: rules?.segmentStartTime || 0,
            endTime: rules?.segmentEndTime || 10,
            name: selectedSketch.name
          };
          
          io.to(gameId).emit("round_start", {
            roundNumber: currentRound + 1,
            video: video,
            timerState: {
              type: 'round',
              startTime: Date.now(),
              duration: rules?.roundLength || 30
            }
          });
        } else {
          // End game
          await Redis.setStatus(gameId, "game_over");
          io.to(gameId).emit("game_over", { players });
        }
      } catch (error) {
        console.error("Error starting next round:", error);
        socket.emit("error_message", { message: "Failed to start next round" });
      }
    });

    socket.on("skip_timer", async ({ gameId }) => {
      try {
        console.log(`SKIP_TIMER event received for gameId: ${gameId} by socket: ${socket.id}`);
        
        const meta = await Redis.getMeta(gameId);
        
        // Verify host permission
        const players = await Redis.getPlayers(gameId);
        const hostPlayer = Object.entries(players).find(([socketId, player]) => player.clientId === meta.hostClientId);
        if (!hostPlayer || hostPlayer[0] !== socket.id) {
          socket.emit("error_message", { message: "Only host can skip timer" });
          return;
        }

        if (meta.status === "round") {
          // Skip to round end
          await Redis.clearTimer(gameId, "round");
          await Redis.setStatus(gameId, "round_end");
          
          const rules = await Redis.getRules(gameId);
          if (rules?.autoProgress) {
            await Redis.startTimer(gameId, "round_end");
          }
          
          io.to(gameId).emit("round_end", {
            scores: players,
            correctVideo: null,
            timerState: {
              type: 'round_end',
              startTime: Date.now(),
              duration: rules?.roundEndLength || 10
            }
          });
        } else if (meta.status === "round_end") {
          // Skip to next round or end game
          const rules = await Redis.getRules(gameId);
          const currentRound = parseInt(meta.round);
          
          if (currentRound < (rules?.rounds || 3)) {
            await Redis.clearTimer(gameId, "round_end");
            await Redis.setStatus(gameId, "round");
            await Redis.incrementRound(gameId);
            await Redis.startTimer(gameId, "round");
            
            const selectedSketch = getRandomSketch();
            const video = {
              url: `https://www.youtube.com/embed/${selectedSketch.youtubeId}`,
              startTime: rules?.segmentStartTime || 0,
              endTime: rules?.segmentEndTime || 10,
              name: selectedSketch.name
            };
            
            io.to(gameId).emit("round_start", {
              roundNumber: currentRound + 1,
              video: video,
              timerState: {
                type: 'round',
                startTime: Date.now(),
                duration: rules?.roundLength || 30
              }
            });
          } else {
            await Redis.setStatus(gameId, "game_over");
            io.to(gameId).emit("game_over", { players });
          }
        }
      } catch (error) {
        console.error("Error skipping timer:", error);
        socket.emit("error_message", { message: "Failed to skip timer" });
      }
    });

    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);
      // Clean up socket binding
      const gameId = await Redis.getGameIdBySocket(socket.id);
      if (gameId) {
        // You might want to handle player disconnection here
      }
    });
  });

  /* ---------- TIMER UPDATE WORKER (sends countdown updates) ---------- */
  setInterval(async () => {
    try {
      // Send timer updates to all active games
      const allTimers = await client.zRange("zset:timers", 0, -1, { withScores: true });
      const now = Date.now();
      
      for (let i = 0; i < allTimers.length; i += 2) {
        const timerKey = allTimers[i];
        const expiresAt = parseInt(allTimers[i + 1]);
        const remainingMs = expiresAt - now;
        
        if (remainingMs > 0) {
          const [gameId, type] = timerKey.split(":");
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          
          // Get timer start info to calculate duration
          const timerInfo = await client.hGetAll(`game:${gameId}:timer`);
          if (timerInfo.type === type) {
            const rules = await Redis.getRules(gameId);
            const duration = type === "round" ? (rules?.roundLength || 30) : (rules?.roundEndLength || 10);
            
            io.to(gameId).emit("timer_update", {
              timerState: {
                type: type as "round" | "round_end",
                startTime: expiresAt - (duration * 1000),
                duration: duration,
                remainingTime: remainingSeconds
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in timer update worker:", error);
    }
  }, 1000); // Update every second

  /* ---------- TIMER WORKER ---------- */
  setInterval(async () => {
    try {
      const now = Date.now();
      const expired = await Redis.pollExpiredTimers(now);

      for (const entry of expired) {
        const [gameId, type] = entry.split(":");
        const rules = await Redis.getRules(gameId);
        
        if (!rules) {
          console.error(`No rules found for game ${gameId}`);
          await Redis.clearTimer(gameId, type);
          continue;
        }

        if (type === "round") {
          await Redis.setStatus(gameId, "round_end");
          
          // Only start round_end timer if autoProgress is enabled
          if (rules.autoProgress) {
            await Redis.startTimer(gameId, "round_end");
          }
          
          const players = await Redis.getPlayers(gameId);
          io.to(gameId).emit("round_end", {
            scores: players,
            correctVideo: null, // TODO: Add correct video
            results: [], // TODO: Add guess results  
            timerState: {
              type: 'round_end',
              startTime: Date.now(),
              duration: rules.roundEndLength
            }
          });
        }

        if (type === "round_end" && rules.autoProgress) {
          const meta = await Redis.getMeta(gameId);
          const currentRound = parseInt(meta.round);
          
          // Check if we should start next round or end game
          if (currentRound < rules.rounds) {
            await Redis.setStatus(gameId, "round");
            await Redis.incrementRound(gameId);
            await Redis.startTimer(gameId, "round");
            
            const updatedMeta = await Redis.getMeta(gameId);
            
            // Select a video for the new round
            const selectedSketch = getRandomSketch();
            const video = {
              url: `https://www.youtube.com/embed/${selectedSketch.youtubeId}`,
              startTime: rules.segmentStartTime || 0,
              endTime: rules.segmentEndTime || 10,
              name: selectedSketch.name
            };
            
            io.to(gameId).emit("round_start", {
              roundNumber: parseInt(updatedMeta.round),
              video: video,
              timerState: {
                type: 'round',
                startTime: Date.now(),
                duration: rules.roundLength
              }
            });
          } else {
            await Redis.setStatus(gameId, "game_over");
            const players = await Redis.getPlayers(gameId);
            io.to(gameId).emit("game_over", {
              finalScores: players,
              leaderboard: Object.entries(players).map(([id, p]) => ({
                playerId: id,
                playerName: p.name,
                score: p.score
              }))
            });
          }
        }

        await Redis.clearTimer(gameId, type);
      }
    } catch (error) {
      console.error("Error in timer worker:", error);
    }
  }, 500);

  /* ---------- START SERVER ---------- */
  server.listen(4000, "0.0.0.0", () => {
    console.log("🚀 Server running on http://0.0.0.0:4000");
  });
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
