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
  httpServer
} from '../../src/index';
import { GameInstance } from '../../src/game';
import { Player } from '../../../shared';

describe('Garbage Collection Integration', () => {
  
  beforeEach(() => {
    games.clear();
    roomCodeToId.clear();
    clientIdToGameId.clear();
    clientIdToSocketId.clear();
  });

  afterAll((done) => {
    if (gcInterval) clearInterval(gcInterval);
    if (httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  test('should cleanup abandoned games after 2 minutes of inactivity', () => {
    const host: Player = { 
      clientId: 'c1', name: 'Host', score: 0, connected: false,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    
    const gameId = 'game-1';
    const roomCode = 'ROOM1';
    const game = new GameInstance(gameId, roomCode, {} as any, host, () => {});
    
    games.set(gameId, game);
    roomCodeToId.set(roomCode, gameId);
    clientIdToGameId.set('c1', gameId);

    // Backdate activity by 2 minutes and 10 seconds
    game.lastActivityAt = Date.now() - (1000 * 60 * 2 + 10000); 

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(false);
    expect(roomCodeToId.has(roomCode)).toBe(false);
  });

  test('should NOT cleanup games even if offline if 2 minutes has NOT passed', () => {
    const host: Player = { 
      clientId: 'c1', name: 'Host', score: 0, connected: false,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    
    const gameId = 'refresh-test';
    const game = new GameInstance(gameId, 'REFRESH', {} as any, host, () => {});
    
    // Only 30 seconds of inactivity (simulating a refresh)
    game.lastActivityAt = Date.now() - 30000; 
    games.set(gameId, game);

    cleanupAbandonedGames();

    // Game should persist to allow reconnection
    expect(games.has(gameId)).toBe(true);
  });

  test('should NOT cleanup games if a player is still connected', () => {
    const host: Player = { 
      clientId: 'c1', name: 'Host', score: 0, connected: true,
      hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' 
    };
    
    const gameId = 'active-game';
    const game = new GameInstance(gameId, 'STAY', {} as any, host, () => {});
    
    // 5 minutes of inactivity, but player is still connected
    game.lastActivityAt = Date.now() - (1000 * 60 * 5); 
    games.set(gameId, game);

    cleanupAbandonedGames();

    expect(games.has(gameId)).toBe(true);
  });
});