import express from 'express';
import { createServer } from 'http';
import cors from "cors";
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameInstance } from './game';
import logger from './logger';

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const games = new Map<string, GameInstance>();
const roomCodeToId = new Map<string, string>();
const clientIdToSocketId = new Map<string, string>();
const clientIdToGameId = new Map<string, string>();

app.post('/create-room', (req, res) => {
  const { config, hostName, hostClientId } = req.body;
  const gameId = uuidv4();
  
  let roomCode = "";
  do {
    roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (roomCodeToId.has(roomCode));

  const host = { clientId: hostClientId, name: hostName, score: 0, connected: true, hasGuessed: false };
  const game = new GameInstance(gameId, roomCode, config, host, (state) => {
    io.to(gameId).emit('game_update', state);
  });

  games.set(gameId, game);
  roomCodeToId.set(roomCode, gameId);
  
  logger.info(`Game Created: ${roomCode}`, { gameId, hostId: hostClientId });
  res.json({ gameId, roomCode });
});

io.on('connection', (socket) => {
  socket.on('identify', ({ clientId, name, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    
    if (!game) {
      logger.warn(`Identify Failed: Room ${roomCode} not found`, { socketId: socket.id });
      return socket.emit('error', 'Game not found');
    }

    clientIdToSocketId.set(clientId, socket.id);
    clientIdToGameId.set(clientId, gameId!);
    socket.join(gameId!);

    if (game.state.players[clientId]) {
      game.setConnectionStatus(clientId, true);
      logger.info(`Player Reconnected: ${name}`, { roomCode, clientId });
    } else {
      game.addPlayer({ clientId, name, score: 0, connected: true, hasGuessed: false });
      logger.info(`Player Joined: ${name}`, { roomCode, clientId });
    }
    
    socket.emit('init_sync', { serverTime: Date.now() });
    socket.emit('game_update', game.state);
  });

  socket.on('start_game', ({ roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (game) {
      logger.info(`Game Started: ${roomCode}`);
      game.start();
    }
  });

  socket.on('submit_guess', ({ clientId, roomCode, guess }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (game) {
      logger.debug(`Guess Submitted`, { clientId, roomCode, guess });
      game.submitGuess(clientId, guess);
    }
  });

  socket.on('leave_game', ({ clientId, roomCode }) => {
    const gameId = roomCodeToId.get(roomCode);
    const game = games.get(gameId || '');
    if (!game) return;

    if (game.state.hostId === clientId && game.state.phase === "LOBBY") {
      logger.info(`Host Closed Room: ${roomCode}`, { clientId });
      io.to(gameId!).emit('error', 'Host closed the room');
      game.destroy();
      games.delete(gameId!);
      roomCodeToId.delete(roomCode);
    } else {
      logger.info(`Player Left: ${clientId}`, { roomCode });
      game.removePlayer(clientId);
      socket.leave(gameId!);
    }
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
        logger.info(`Socket Disconnected`, { clientId: dClientId, roomCode: game.roomCode });

        if (game.state.hostId === dClientId && game.state.phase === "LOBBY") {
          logger.info(`Lobby Host Disconnected - Closing Room`, { roomCode: game.roomCode });
          io.to(gId!).emit('error', 'Host disconnected from lobby');
          game.destroy();
          games.delete(gId!);
          roomCodeToId.delete(game.roomCode);
        }
      }
      clientIdToSocketId.delete(dClientId);
    }
  });
});

// GC: Cleanup abandoned games every 5 mins
setInterval(() => {
  const now = Date.now();
  games.forEach((game, id) => {
    const allOffline = Object.values(game.state.players).every(p => !p.connected);
    if (allOffline && (now - game.lastActivityAt > 1000 * 60 * 10)) {
      logger.info(`Garbage Collection: Removing Game ${game.roomCode}`, { gameId: id });
      game.destroy();
      roomCodeToId.delete(game.roomCode);
      games.delete(id);
    }
  });
}, 1000 * 60 * 5);

httpServer.listen(3001, () => logger.info('Server started on port 3001'));