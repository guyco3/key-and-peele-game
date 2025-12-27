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
// Reduced to 2 minutes for aggressive memory management on 1GB RAM
const GAME_INACTIVITY_TIMEOUT = 1000 * 60 * 2; 
const GC_INTERVAL = 1000 * 60 * 1; 

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

export const games = new Map<string, GameInstance>();
export const roomCodeToId = new Map<string, string>();
export const clientIdToSocketId = new Map<string, string>();
export const clientIdToGameId = new Map<string, string>();

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
  
  for (const [code, id] of roomCodeToId.entries()) {
    if (id === gameId) roomCodeToId.delete(code);
  }
};

export const cleanupAbandonedGames = () => {
  const now = Date.now();
  let count = 0;

  games.forEach((game, id) => {
    const players = Object.values(game.state.players);
    // Everyone must be offline
    const allOffline = players.length > 0 && players.every(p => !p.connected);
    // Must have passed the 2-minute inactivity threshold
    const isInactive = (now - game.lastActivityAt > GAME_INACTIVITY_TIMEOUT);

    // We no longer delete GAME_OVER games instantly to allow for refreshes
    if (allOffline && isInactive) {
      fullyDeleteGame(id, game.roomCode);
      count++;
    }
  });

  if (count > 0) logger.info(`[GC] Purged ${count} abandoned games.`);
};

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
    clientId: hostClientId, name: hostName, score: 0, 
    connected: true, hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: ''
  };

  const game = new GameInstance(gameId, roomCode, config, host, (state) => {
    io.to(gameId).emit('game_update', state);
  });

  games.set(gameId, game);
  roomCodeToId.set(roomCode, gameId);
  res.json({ gameId, roomCode });
});

io.on('connection', (socket) => {
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

  socket.on('identify', ({ clientId, name, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (!game) return socket.emit('error', 'Game not found');

    if (!game.state.players[clientId] && Object.keys(game.state.players).length >= MAX_PLAYERS_PER_GAME) {
      return socket.emit('error', 'Room is full.');
    }

    clientIdToSocketId.set(clientId, socket.id);
    clientIdToGameId.set(clientId, gameId!);
    socket.join(gameId!);

    if (game.state.players[clientId]) {
      game.setConnectionStatus(clientId, true);
    } else {
      game.addPlayer({ clientId, name, score: 0, connected: true, hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' });
    }
    
    socket.emit('init_sync', { serverTime: Date.now() });
    socket.emit('game_update', game.state);
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

export const gcInterval = process.env.NODE_ENV !== 'test' 
  ? setInterval(cleanupAbandonedGames, GC_INTERVAL) 
  : undefined;

// Memory Watchdog for 1GB Droplet
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(3001, () => logger.info('Server started on port 3001'));
}

export { httpServer };