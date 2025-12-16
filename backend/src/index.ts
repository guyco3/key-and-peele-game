import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as Redis from "./services/redis.service";

async function main() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  app.use(express.json());
  await Redis.initRedis();
  console.log("✅ Redis initialized, starting server...");

  /* ---------- HTTP ---------- */
  app.post("/api/games", async (req, res) => {
    const { name, clientId, rules } = req.body;
    const game = await Redis.createGame(clientId, name, rules);
    res.json(game);
  });

  /* ---------- SOCKETS ---------- */
  io.on("connection", (socket) => {
    socket.on("join", async ({ gameId }) => {
      await Redis.bindSocketToGame(socket.id, gameId);
      socket.join(gameId);
    });

    socket.on("start_game", async ({ gameId, roundLength }) => {
      await Redis.setStatus(gameId, "round");
      await Redis.incrementRound(gameId);
      await Redis.startTimer(gameId, "round", roundLength);
      io.to(gameId).emit("round_started");
    });

    socket.on("submit_guess", async ({ gameId, round, guess }) => {
      await Redis.storeGuess(gameId, round, socket.id, guess);
    });

    socket.on("disconnect", async () => {});
  });

  /* ---------- TIMER WORKER ---------- */
  setInterval(async () => {
    const now = Date.now();
    const expired = await Redis.pollExpiredTimers(now);

    for (const entry of expired) {
      const [gameId, type] = entry.split(":");

      if (type === "round") {
        await Redis.setStatus(gameId, "round_end");
        await Redis.startTimer(gameId, "round_end", 5);
        io.to(gameId).emit("round_ended");
      }

      if (type === "round_end") {
        await Redis.setStatus(gameId, "round");
        await Redis.incrementRound(gameId);
        await Redis.startTimer(gameId, "round", 20);
        io.to(gameId).emit("next_round");
      }

      await Redis.clearTimer(gameId, type);
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
