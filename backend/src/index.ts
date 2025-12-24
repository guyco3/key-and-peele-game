import express from 'express';
import { createServer } from 'http';
import cors from "cors";
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameInstance } from './game';
import logger from './logger';
import { Player } from '../../shared';

const MAX_PLAYERS_PER_GAME = 50;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const games = new Map<string, GameInstance>();
const roomCodeToId = new Map<string, string>();
const clientIdToSocketId = new Map<string, string>();
const clientIdToGameId = new Map<string, string>();

/**
 * HELPER: Full Cleanup
 * Prevents memory leaks by clearing all associated player mappings.
 */
const fullyDeleteGame = (gameId: string, roomCode: string) => {
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
};

app.post('/create-room', (req, res) => {
  const { config, hostName, hostClientId } = req.body;
  const gameId = uuidv4();
  
  let roomCode = "";
  do {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (roomCodeToId.has(roomCode));

  const host: Player = { 
    clientId: hostClientId, 
    name: hostName, 
    score: 0, 
    connected: true, 
    hasGuessed: false,
    lastGuessCorrect: false,
    lastGuessSketch: ''
  };

  const game = new GameInstance(gameId, roomCode, config, host, (state) => {
    io.to(gameId).emit('game_update', state);
  });

  games.set(gameId, game);
  roomCodeToId.set(roomCode, gameId);
  
  logger.info(`[Room Created] Code: ${roomCode} | Host: ${hostName}`);
  res.json({ gameId, roomCode });
});

io.on('connection', (socket) => {

  // 🌐 NEW: Quick Play Logic
  socket.on('quick_play', ({ clientId, name }) => {
    // Find all games that are PUBLIC and in LOBBY phase
  const availableGames = Array.from(games.values()).filter(
      (g) => 
        g.state.config.isPublic && 
        g.state.phase === "LOBBY" &&
        Object.keys(g.state.players).length < MAX_PLAYERS_PER_GAME // 👈 ADD THIS
    );

    if (availableGames.length === 0) {
      return socket.emit('error', 'No public games available. Why not host one?');
    }

    // Pick a random public game
    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    
    // Tell the client which room they found so they can "identify" normally
    socket.emit('quick_play_found', { roomCode: randomGame.roomCode });
  });

  socket.on('identify', ({ clientId, name, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    
    if (!game) {
      return socket.emit('error', 'Game not found');
    }

    // 🛡️ CAPACITY GUARD: Check if room is full
    const playerCount = Object.keys(game.state.players).length;
    const isExistingPlayer = !!game.state.players[clientId];

    // Only block if it's a NEW player joining a full room
    if (!isExistingPlayer && playerCount >= MAX_PLAYERS_PER_GAME) {
      return socket.emit('error', `This room is full (Max ${MAX_PLAYERS_PER_GAME} players).`);
    }

    // Update session mappings
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
    
    // Only the host can start the game
    if (game && game.state.hostId === clientId) {
      game.start();
    }
  });

  socket.on('submit_guess', ({ clientId, roomCode, guess }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (game) {
      game.submitGuess(clientId, guess);
    }
  });

  socket.on('leave_game', ({ clientId, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    if (!gameId) return;

    const game = games.get(gameId);
    if (!game) return;

    if (game.state.hostId === clientId && game.state.phase === "LOBBY") {
      io.to(gameId).emit('error', 'Host closed the room');
      fullyDeleteGame(gameId, roomCode);
    } else {
      game.removePlayer(clientId);
      clientIdToGameId.delete(clientId);
      clientIdToSocketId.delete(clientId);
      socket.leave(gameId);
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

      if (game) {
        game.setConnectionStatus(dClientId, false);
      }
      // Note: We keep clientIdToGameId so they can reconnect!
      clientIdToSocketId.delete(dClientId);
    }
  });
});

// GC: Cleanup abandoned games (everyone offline for 10 mins)
setInterval(() => {
  const now = Date.now();
  games.forEach((game, id) => {
    const allOffline = Object.values(game.state.players).every(p => !p.connected);
    if (allOffline && (now - game.lastActivityAt > 1000 * 60 * 10)) {
      logger.info(`[GC] Removing abandoned game: ${game.roomCode}`);
      fullyDeleteGame(id, game.roomCode);
    }
  });
}, 1000 * 60 * 5);

httpServer.listen(3001, () => logger.info('Server started on port 3001'));
