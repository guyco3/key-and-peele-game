import { createClient } from "redis";
import { v4 as uuid } from "uuid";
import type { GameRules, Player, Guess, GameStatus } from "@shared";

let client: ReturnType<typeof createClient>;

const GAME_TTL = 15 * 60; // 15 min
const ROUND_END_TTL = 10; // seconds buffer for round_end (optional)

/* ---------- init ---------- */
export async function initRedis() {
  client = createClient();
  client.on("error", (err) => console.error("Redis error:", err));

  await client.connect();
  console.log("✅ Redis connected");
}

/* ---------- game creation ---------- */
export async function createGame(hostClientId: string, hostName: string, rules: GameRules) {
  const gameId = uuid();
  const pin = generatePin();

  await client.set(`pin:${pin}`, gameId, { EX: GAME_TTL });

  await client.hSet(`game:${gameId}:meta`, {
    gameId,
    pin,
    status: "lobby",
    round: 0,
    hostClientId,
    createdAt: Date.now().toString(),
    rules: JSON.stringify(rules),
  });

  await client.hSet(`game:${gameId}:players`, {
    pending: JSON.stringify({
      name: hostName,
      clientId: hostClientId,
      score: 0,
    }),
  });

  await client.expire(`game:${gameId}:meta`, GAME_TTL);
  await client.expire(`game:${gameId}:players`, GAME_TTL);

  return { gameId, pin };
}

/* ---------- joins ---------- */
export async function bindSocketToGame(socketId: string, gameId: string) {
  await client.set(`socket:${socketId}:game`, gameId, { EX: GAME_TTL });
}

export async function getGameIdBySocket(socketId: string) {
  return client.get(`socket:${socketId}:game`);
}

export async function getGameIdByPin(pin: string) {
  return client.get(`pin:${pin}`);
}

/* ---------- timers (stateless) ---------- */
export async function startTimer(gameId: string, type: "round" | "round_end", durationSec?: number) {
  // Get game rules to determine timer durations
  const meta = await getMeta(gameId);
  if (!meta.rules) throw new Error("Game rules not found");
  
  const rules: GameRules = JSON.parse(meta.rules);
  let finalDuration: number;

  if (durationSec !== undefined) {
    finalDuration = durationSec;
  } else if (type === "round") {
    finalDuration = rules.roundLength;
  } else if (type === "round_end") {
    finalDuration = rules.autoProgress ? rules.roundEndLength : GAME_TTL; // If no autoProgress, set to game TTL
  } else {
    finalDuration = ROUND_END_TTL;
  }

  const endsAt = Date.now() + finalDuration * 1000;

  await client.hSet(`game:${gameId}:timer`, { type, endsAt: endsAt.toString() });
  await client.zAdd("zset:timers", { score: endsAt, value: `${gameId}:${type}` });
}

export async function pollExpiredTimers(now: number) {
  return client.zRangeByScore("zset:timers", 0, now);
}

export async function clearTimer(gameId: string, type: string) {
  await client.zRem("zset:timers", `${gameId}:${type}`);
  await client.del(`game:${gameId}:timer`);
}

/* ---------- game state ---------- */
export async function getMeta(gameId: string) {
  return client.hGetAll(`game:${gameId}:meta`);
}

export async function getRules(gameId: string): Promise<GameRules | null> {
  const meta = await getMeta(gameId);
  if (!meta.rules) return null;
  try {
    return JSON.parse(meta.rules);
  } catch {
    return null;
  }
}

export async function setStatus(gameId: string, status: GameStatus) {
  await client.hSet(`game:${gameId}:meta`, { status });
}

export async function incrementRound(gameId: string) {
  await client.hIncrBy(`game:${gameId}:meta`, "round", 1);
}

/* ---------- players ---------- */
export async function getPlayers(gameId: string): Promise<Record<string, Player>> {
  const data = await client.hGetAll(`game:${gameId}:players`);
  const players: Record<string, Player> = {};

  for (const [playerId, value] of Object.entries(data)) {
    try {
      players[playerId] = JSON.parse(value);
    } catch {
      continue;
    }
  }

  return players;
}

export async function getPlayer(gameId: string, playerId: string) {
  const players = await getPlayers(gameId);
  return players[playerId] || null;
}

/* ---------- guesses ---------- */
export async function storeGuess(gameId: string, round: number, playerId: string, guess: Guess) {
  await client.hSet(`game:${gameId}:round:${round}:guesses`, playerId, JSON.stringify(guess));
}

/* ---------- cleanup ---------- */
export async function deleteGame(gameId: string) {
  const pin = await client.hGet(`game:${gameId}:meta`, "pin");
  if (pin) await client.del(`pin:${pin}`);
  await client.del([`game:${gameId}:meta`, `game:${gameId}:players`, `game:${gameId}:timer`]);
}

/* ---------- utils ---------- */
function generatePin() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
