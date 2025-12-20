import { GameInstance } from './game';

describe('Server & Socket Integration Logic', () => {
  let games: Map<string, GameInstance>;
  const now = Date.now();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    games = new Map();
  });

  test('Connection Logic: Identify handles re-joining existing players', () => {
    const host = { clientId: 'H1', name: 'Guy', score: 1000, connected: false, hasGuessed: false };
    const game = new GameInstance('g1', 'ROOM', {} as any, host, jest.fn());
    games.set('g1', game);

    // Simulation of the "identify" socket logic
    const clientId = 'H1';
    if (game.state.players[clientId]) {
      game.setConnectionStatus(clientId, true);
    }

    expect(game.state.players['H1'].connected).toBe(true);
    expect(game.state.players['H1'].score).toBe(1000); // Score preserved
    expect(Object.keys(game.state.players).length).toBe(1); // No duplicate player created
  });

  test('GC: Only removes games when ALL players are offline', () => {
    const p1 = { clientId: 'H1', name: 'Guy', score: 0, connected: false, hasGuessed: false };
    const p2 = { clientId: 'P2', name: 'A-A-Ron', score: 0, connected: true, hasGuessed: false };
    
    const game = new GameInstance('g1', 'ROOM', {} as any, p1, jest.fn());
    game.addPlayer(p2);
    games.set('g1', game);
    
    game.lastActivityAt = now - (1000 * 60 * 20); // 20 mins ago

    // Run cleanup logic
    const cleanup = () => {
      games.forEach((g, id) => {
        const allOffline = Object.values(g.state.players).every(p => !p.connected);
        if (allOffline && (Date.now() - g.lastActivityAt > 1000 * 60 * 10)) {
          games.delete(id);
        }
      });
    };

    cleanup();
    // Game should persist because P2 is still connected
    expect(games.has('g1')).toBe(true);

    // Now disconnect P2 and run again
    game.setConnectionStatus('P2', false);
    cleanup();
    expect(games.has('g1')).toBe(false);
  });
});