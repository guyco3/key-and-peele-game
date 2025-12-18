import { GameInstance } from './game';

describe('Server Garbage Collection Integration', () => {
  let games: Map<string, GameInstance>;
  let roomCodeToId: Map<string, string>;
  const now = 1766038836729;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    games = new Map();
    roomCodeToId = new Map();
  });

  const runCleanupJob = () => {
    const currentTime = Date.now();
    games.forEach((game, id) => {
      const allOffline = Object.values(game.state.players).every(p => !p.connected);
      // Logic: If everyone is offline and it's been > 10 mins
      if (allOffline && (currentTime - game.lastActivityAt > 1000 * 60 * 10)) {
        game.destroy();
        roomCodeToId.delete(game.roomCode);
        games.delete(id);
      }
    });
  };

  test('GC: Deletes game after everyone is offline for 10 minutes', () => {
    const host = { clientId: 'H1', name: 'Ada', score: 0, connected: false, hasGuessed: false };
    const game = new GameInstance('g1', 'ROOM', {} as any, host, jest.fn());
    
    // Setup state: Game exists, but host is already offline
    games.set('g1', game);
    roomCodeToId.set('ROOM', 'g1');
    game.lastActivityAt = now;

    // Advance 5 minutes - Game should still exist
    jest.advanceTimersByTime(1000 * 60 * 5);
    jest.setSystemTime(now + 1000 * 60 * 5);
    runCleanupJob();
    expect(games.has('g1')).toBe(true);

    // Advance total 11 minutes - Game should be wiped
    jest.advanceTimersByTime(1000 * 60 * 6);
    jest.setSystemTime(now + 1000 * 60 * 11);
    runCleanupJob();

    expect(games.has('g1')).toBe(false);
    expect(roomCodeToId.has('ROOM')).toBe(false);
  });

  test('GC: Does NOT delete game if at least one player is connected', () => {
    const host = { clientId: 'H1', name: 'Ada', score: 0, connected: true, hasGuessed: false };
    const game = new GameInstance('g1', 'ROOM', {} as any, host, jest.fn());
    
    games.set('g1', game);
    game.lastActivityAt = now;

    // Advance 15 minutes
    jest.advanceTimersByTime(1000 * 60 * 15);
    jest.setSystemTime(now + 1000 * 60 * 15);
    runCleanupJob();

    // Game should stay because Host is still connected
    expect(games.has('g1')).toBe(true);
  });
});