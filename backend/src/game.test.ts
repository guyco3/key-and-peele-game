import { GameInstance } from './game';
import { GameConfig, Player, Sketch } from '../../shared';

const mockConfig: GameConfig = {
  numRounds: 2,
  clipLength: 5,
  roundLength: 30,
  roundEndLength: 10,
  sketches: [
    { id: '1', name: 'Sketch A', youtubeId: 'A', description: 'Desc A', tags: [] },
    { id: '2', name: 'Sketch B', youtubeId: 'B', description: 'Desc B', tags: [] },
  ],
};

describe('GameInstance Complete Lifecycle & Resilience', () => {
  let game: GameInstance;
  let host: Player;
  let updateFn: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    updateFn = jest.fn();
    host = { clientId: 'H1', name: 'Ada', score: 0, connected: true, hasGuessed: false };
    game = new GameInstance('g1', 'ROOM', mockConfig, host, updateFn);
  });

  afterEach(() => {
    game.destroy();
    jest.clearAllTimers();
  });

  // --- LOBBY & HOST INVARIANTS ---
  
  test('Lobby: Host leaving state is detectable', () => {
    // Logic: In index.ts, we check if (phase === 'LOBBY' && clientId === hostId)
    // Here we verify the game instance reports these correctly
    expect(game.state.phase).toBe('LOBBY');
    expect(game.state.hostId).toBe('H1');
    
    game.setConnectionStatus('H1', false);
    expect(game.state.players['H1'].connected).toBe(false);
  });

  test('Lobby: Removing a player works', () => {
    game.addPlayer({ clientId: 'P2', name: 'Lina', score: 0, connected: true, hasGuessed: false });
    game.removePlayer('P2');
    expect(game.state.players['P2']).toBeUndefined();
  });

  // --- FULL GAME FLOW ---

  test('Full Flow: Reaches GAME_OVER after all rounds', () => {
    game.start();

    // --- Round 1 ---
    expect(game.state.currentRound).toBe(1);
    expect(game.state.phase).toBe('ROUND_PLAYING');
    jest.advanceTimersByTime(30000); // Finish Playing
    expect(game.state.phase).toBe('ROUND_REVEAL');
    jest.advanceTimersByTime(10000); // Finish Reveal

    // --- Round 2 ---
    expect(game.state.currentRound).toBe(2);
    expect(game.state.phase).toBe('ROUND_PLAYING');
    jest.advanceTimersByTime(30000); // Finish Playing
    expect(game.state.phase).toBe('ROUND_REVEAL');
    jest.advanceTimersByTime(10000); // Finish Reveal

    // --- Final State ---
    expect(game.state.phase).toBe('GAME_OVER');
    expect(game.state.currentRound).toBe(2);
    // currentSketch should still be the last sketch shown
    expect(game.state.currentSketch?.name).toBe('Sketch B');
  });

  // --- RESILIENCE & RECONNECTION ---

  test('Mid-Game Host Resilience: Game continues autonomously if host is gone', () => {
    game.start();
    game.setConnectionStatus('H1', false); // Host disconnects mid-round 1

    jest.advanceTimersByTime(30000); // Playing ends
    expect(game.state.phase).toBe('ROUND_REVEAL');
    
    jest.advanceTimersByTime(10000); // Reveal ends
    expect(game.state.phase).toBe('ROUND_PLAYING'); // Successfully moved to Round 2
    expect(game.state.currentRound).toBe(2);
  });

  test('Reconnection: Player maintains score and guess status', () => {
    game.start();
    game.submitGuess('H1', 'Sketch A');
    const scoreBefore = game.state.players['H1'].score;

    game.setConnectionStatus('H1', false);
    game.setConnectionStatus('H1', true);

    expect(game.state.players['H1'].score).toBe(scoreBefore);
    expect(game.state.players['H1'].hasGuessed).toBe(true);
  });

  // --- DATA INTEGRITY ---

  test('Guess Masking: Sketches are only fully revealed during ROUND_REVEAL', () => {
    game.start();
    // In PLAYING, name/desc should be missing
    expect(game.state.currentSketch?.name).toBeUndefined();
    expect(game.state.currentSketch?.youtubeId).toBe('A');

    jest.advanceTimersByTime(30000);
    // In REVEAL, name/desc should be present
    expect(game.state.currentSketch?.name).toBe('Sketch A');
    expect(game.state.currentSketch?.description).toBe('Desc A');
  });

test('Garbage Collection: State marks activity time correctly', () => {
  const startTime = 1766038836729;
  jest.useFakeTimers();
  jest.setSystemTime(startTime);
  
  // 1. Setup the game
  const testHost = { clientId: 'H1', name: 'Ada', score: 0, connected: true, hasGuessed: false };
  const testGame = new GameInstance('gc-test', 'ROOM', mockConfig, testHost, jest.fn());
  
  // Force sync the initial time to our mock
  testGame.lastActivityAt = startTime;
  expect(testGame.lastActivityAt).toBe(startTime);

  // 2. Move the mock clock forward
  const newTime = startTime + 5000;
  jest.setSystemTime(newTime);
  
  // 3. Trigger an action that updates the timestamp
  // We use addPlayer because it's a simple, direct update to lastActivityAt
  testGame.addPlayer({ clientId: 'P2', name: 'Lina', score: 0, connected: true, hasGuessed: false });
  
  // 4. Verification
  console.log(`Expected: ${newTime}, Actual: ${testGame.lastActivityAt}`);
  expect(testGame.lastActivityAt).toBe(newTime);
  expect(testGame.lastActivityAt).toBeGreaterThan(startTime);
  
  testGame.destroy();
});
});