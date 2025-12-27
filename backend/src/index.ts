import express from 'express';
import { createServer } from 'http';
import cors from "cors";
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameInstance } from './game';
import logger from './logger';
import { Player } from '../../shared';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const MAX_PLAYERS_PER_GAME = 25;
// Aggressive memory management for 1GB RAM
const GAME_INACTIVITY_TIMEOUT = 1000 * 60 * 2; // 2 minutes
const GC_INTERVAL = 1000 * 60 * 1; // Check every 1 minute
const STATS_SECRET = 'fake, changed on VM';

const rateLimiter = new RateLimiterMemory({
  points: 10, 
  duration: 1, 
});

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { 
  cors: { origin: "*" },
  pingTimeout: 30000,
  pingInterval: 10000 
});

// Exported for testing and GC
export const games = new Map<string, GameInstance>();
export const roomCodeToId = new Map<string, string>();
export const clientIdToSocketId = new Map<string, string>();
export const clientIdToGameId = new Map<string, string>();

/**
 * HELPER: Full Purge
 * Clears all player session mappings and destroys the game instance.
 */
export const fullyDeleteGame = (gameId: string, roomCode: string) => {
  const game = games.get(gameId);
  if (game) {
    Object.keys(game.state.players).forEach(cId => {
      clientIdToGameId.delete(cId);
      clientIdToSocketId.delete(cId);
    });
    game.destroy();
  }
  games.delete(gameId);
  roomCodeToId.delete(roomCode);
  
  // Safety: Clean up dangling room code references
  for (const [code, id] of roomCodeToId.entries()) {
    if (id === gameId) roomCodeToId.delete(code);
  }
};

/**
 * GC TASK: Checks for abandoned games every minute
 */
export const cleanupAbandonedGames = () => {
  const now = Date.now();
  let count = 0;

  games.forEach((game, id) => {
    const players = Object.values(game.state.players);
    const allOffline = players.length > 0 && players.every(p => !p.connected);
    const isInactive = (now - game.lastActivityAt > GAME_INACTIVITY_TIMEOUT);

    if (allOffline && isInactive) {
      logger.info(`[GC] Removing abandoned game: ${game.roomCode}`);
      fullyDeleteGame(id, game.roomCode);
      count++;
    }
  });

  if (count > 0) logger.info(`[GC] Finished. Purged ${count} games.`);
};

// --- HTTP ROUTES ---

app.get('/api/stats', (req, res) => {
  // 1. Check key immediately before doing ANY heavy lifting
  if (req.query.key !== STATS_SECRET) {
    // End the request instantly with a 403. 
    // .end() is faster than .json() because it doesn't parse a body.
    return res.status(403).end(); 
  }

  // 2. Only calculate stats if the key is valid
  const activeGames = games.size;
  const totalPlayers = Array.from(games.values()).reduce(
    (acc, game) => acc + Object.keys(game.state.players).length, 0
  );
  
  const memory = process.memoryUsage();

  res.json({
    activeGames,
    totalPlayers,
    heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
    uptime: Math.round(process.uptime()) + "s"
  });
});


app.post('/create-room', (req, res) => {
  const { config, hostName, hostClientId } = req.body;
  const gameId = uuidv4();
  
  let roomCode = "";
  let attempts = 0;
  do {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    attempts++;
  } while (roomCodeToId.has(roomCode) && attempts < 10);

  const host: Player = { 
    clientId: hostClientId, name: hostName, score: 0, connected: true, 
    hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: ''
  };

  const game = new GameInstance(gameId, roomCode, config, host, (state) => {
    io.to(gameId).emit('game_update', state);
  });

  games.set(gameId, game);
  roomCodeToId.set(roomCode, gameId);
  
  logger.info(`[Room Created] Code: ${roomCode} | Host: ${hostName}`);
  res.json({ gameId, roomCode });
});

// --- SOCKET LOGIC ---

io.on('connection', (socket) => {
  // IP-based Rate Limiting Middleware
  socket.use(async (_packet, next) => {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const clientIP: string = Array.isArray(forwarded) ? forwarded[0] : forwarded || socket.handshake.address;
    try {
      await rateLimiter.consume(clientIP);
      next();
    } catch {
      socket.emit('error', 'Too many requests. Slow down!');
    }
  });

  // Quick Play: Find public lobby
  socket.on('quick_play', ({ clientId, name }) => {
    const availableGames = Array.from(games.values()).filter(
      (g) => 
        g.state.config.isPublic && 
        g.state.phase === "LOBBY" &&
        Object.keys(g.state.players).length < MAX_PLAYERS_PER_GAME 
    );

    availableGames.sort((a, b) => 
      Object.keys(b.state.players).length - Object.keys(a.state.players).length
    );

    if (availableGames.length === 0) {
      return socket.emit('error', 'No public games available. Why not host one?');
    }

    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    socket.emit('quick_play_found', { roomCode: randomGame.roomCode });
  });

  // Identify: Join or Reconnect
  socket.on('identify', ({ clientId, name, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    
    if (!game) return socket.emit('error', 'Game not found');

    const playerCount = Object.keys(game.state.players).length;
    const isExistingPlayer = !!game.state.players[clientId];

    if (!isExistingPlayer && playerCount >= MAX_PLAYERS_PER_GAME) {
      return socket.emit('error', `This room is full (Max ${MAX_PLAYERS_PER_GAME} players).`);
    }

    clientIdToSocketId.set(clientId, socket.id);
    clientIdToGameId.set(clientId, gameId!);
    socket.join(gameId!);

    if (game.state.players[clientId]) {
      game.setConnectionStatus(clientId, true);
      logger.info(`[Reconnected] ${name} to ${roomCode}`);
    } else {
      game.addPlayer({ clientId, name, score: 0, connected: true, hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' });
      logger.info(`[Joined] ${name} to ${roomCode}`);
    }
    
    socket.emit('init_sync', { serverTime: Date.now() });
    socket.emit('game_update', game.state);
  });

  socket.on('start_game', ({ roomCode, clientId }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (game && game.state.hostId === clientId) {
      game.start();
    }
  });

  socket.on('submit_guess', ({ clientId, roomCode, guess }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (game) game.submitGuess(clientId, guess);
  });

  socket.on('leave_game', ({ clientId, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (!game) return;

    if (game.state.hostId === clientId && game.state.phase === "LOBBY") {
      io.to(gameId!).emit('error', 'Host closed the room');
      fullyDeleteGame(gameId!, roomCode);
    } else {
      game.removePlayer(clientId);
      clientIdToGameId.delete(clientId);
      clientIdToSocketId.delete(clientId);
      socket.leave(gameId!);
    }
  });

  socket.on('video_error', ({ clientId, roomCode, youtubeId, errorCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (!game) return;

    const currentVideo = game.state.currentSketch?.youtubeId;
    if (game.state.phase !== "ROUND_PLAYING") return;
    if (currentVideo && youtubeId && currentVideo !== youtubeId) return;

    game.rerollVideoForError(clientId, errorCode);
  });

  socket.on('disconnect', () => {
    let dClientId: string | undefined;
    for (const [cId, sId] of clientIdToSocketId.entries()) {
      if (sId === socket.id) {
        dClientId = cId;
        break;
      }
    }

    if (dClientId) {
      const gId = clientIdToGameId.get(dClientId);
      const game = games.get(gId || '');
      if (game) game.setConnectionStatus(dClientId, false);
      clientIdToSocketId.delete(dClientId);
    }
  });
});

// Start GC Interval
export const gcInterval = process.env.NODE_ENV !== 'test' 
  ? setInterval(cleanupAbandonedGames, GC_INTERVAL) 
  : undefined;

// Listen only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(3001, () => logger.info('Server started on port 3001'));
}

export { httpServer };