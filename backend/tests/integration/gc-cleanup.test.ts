jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-' + Math.random().toString(36).slice(2)
}));

jest.mock('../../src/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

import { 
  games, 
  roomCodeToId, 
  clientIdToGameId, 
  clientIdToSocketId, 
  cleanupAbandonedGames, 
  gcInterval,
  httpServer,
  fullyDeleteGame
} from '../../src/index';
import { GameInstance } from '../../src/game';
import { Player } from '../../../shared';

describe('Garbage Collection Edge Cases', () => {
  
  const FIVE_MINUTES_MS = 1000 * 60 * 5;

  beforeEach(() => {
    // Clear all global state before every test
    games.clear();
    roomCodeToId.clear();
    clientIdToGameId.clear();
    clientIdToSocketId.clear();
    jest.clearAllMocks();
  });

  afterAll((done) => {
    if (gcInterval) clearInterval(gcInterval);
    if (httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  /**
   * CASE 1: OVER THE TIME LIMIT (AFK PROTECTION)
   * Even if players are "connected," if they haven't guessed or 
   * moved the game forward in 5 mins, we kill the room.
   */
  test('should purge rooms where players are present but inactive for > 5 mins', () => {
    const host: Player = { 
      clientId: 'c1', name: 'IdleHost', score: 0, connected: true,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    const gameId = 'afk-room';
    const roomCode = 'AFK123';
    const game = new GameInstance(gameId, roomCode, {} as any, host, () => {});
    
    games.set(gameId, game);
    roomCodeToId.set(roomCode, gameId);

    // Set activity to 6 minutes ago
    game.lastActivityAt = Date.now() - (FIVE_MINUTES_MS + 60000); 

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(false);
    expect(roomCodeToId.has(roomCode)).toBe(false);
  });

  /**
   * CASE 2: ONLY EMPTY PLAYER LIST
   * If a room has 0 players, it serves no purpose. 
   * GC should kill it even if it was "active" recently.
   */
  test('should purge empty rooms even if they were active recently', () => {
    const host: Player = { 
      clientId: 'c1', name: 'Leaver', score: 0, connected: true,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    const gameId = 'empty-room';
    const roomCode = 'GONE1';
    const game = new GameInstance(gameId, roomCode, {} as any, host, () => {});
    
    // Simulate all players leaving via a bug or unexpected disconnect
    game.state.players = {}; 
    game.lastActivityAt = Date.now(); // Brand new activity

    games.set(gameId, game);
    roomCodeToId.set(roomCode, gameId);

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(false);
  });

  /**
   * CASE 3: EMPTY PLAYER LIST + OVER TIME LIMIT
   * The "Double Whammy" - definitely should be removed.
   */
  test('should purge rooms that are both empty and over the time limit', () => {
    const gameId = 'zombie-room';
    const roomCode = 'DEAD1';
    // Manually create an empty instance
    const game = new GameInstance(gameId, roomCode, {} as any, {clientId: 'ghost'} as any, () => {});
    game.state.players = {}; 
    game.lastActivityAt = Date.now() - (FIVE_MINUTES_MS * 2); 

    games.set(gameId, game);
    roomCodeToId.set(roomCode, gameId);

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(false);
  });

  /**
   * CASE 4: UNDER TIME LIMIT (THE "KEEP ALIVE" CASE)
   * We must ensure active players aren't kicked.
   */
  test('should NOT purge rooms with players that are under the 5-minute limit', () => {
    const host: Player = { 
      clientId: 'c1', name: 'ActiveHost', score: 0, connected: true,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    const gameId = 'valid-room';
    const game = new GameInstance(gameId, 'KEEP', {} as any, host, () => {});
    
    // Only 2 minutes of inactivity
    game.lastActivityAt = Date.now() - (1000 * 60 * 2); 
    games.set(gameId, game);

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(true);
  });

  /**
   * CASE 5: GLOBAL MAPPING CLEANUP
   * This is the most important for your VM's long-term health.
   * If the GameInstance is deleted but clientIdToGameId remains, you have a memory leak.
   */
  test('should scrub all global Map references when a game is purged', () => {
    const cId = 'player-99';
    const gId = 'leak-test';
    const code = 'LEAK1';
    const host: Player = { 
      clientId: cId, name: 'Tester', score: 0, connected: true,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    
    const game = new GameInstance(gId, code, {} as any, host, () => {});
    
    // Setup mappings
    games.set(gId, game);
    roomCodeToId.set(code, gId);
    clientIdToGameId.set(cId, gId);
    clientIdToSocketId.set(cId, 'socket-123');

    // Trigger GC via inactivity
    game.lastActivityAt = Date.now() - (FIVE_MINUTES_MS + 1000); 
    cleanupAbandonedGames();

    expect(games.has(gId)).toBe(false);
    expect(roomCodeToId.has(code)).toBe(false);
    expect(clientIdToGameId.has(cId)).toBe(false);
    expect(clientIdToSocketId.has(cId)).toBe(false);
  });
});