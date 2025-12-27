import { GameInstance } from '../../src/game';
import { Player, GameConfig } from '../../../shared';

// 1. Mock Logger
jest.mock('../../src/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// 2. Mock Sketches with diverse data for edge cases
jest.mock('../../../shared/sketches', () => ({
  SKETCHES: [
    { id: '1', name: 'Substitute Teacher', youtubeId: 'abc', difficulty: 'easy' },
    { id: '2', name: 'Continental Breakfast', youtubeId: 'def', difficulty: 'medium' },
    { id: '3', name: 'Valet', youtubeId: 'ghi', difficulty: 'hard' },
  ],
}));

describe('GameInstance Comprehensive Unit Tests', () => {
  let host: Player;
  let config: GameConfig;
  let onUpdate: jest.Mock;
  let game: GameInstance;

  beforeEach(() => {
    host = {
      clientId: 'host-1',
      name: 'HostUser',
      score: 0,
      connected: true,
      hasGuessed: false,
      lastGuessCorrect: false,
      lastGuessSketch: '',
    };

    config = {
      numRounds: 2,
      clipLength: 10,
      roundLength: 30,
      roundEndLength: 5,
      isPublic: true,
      difficulty: 'all',
      randomStartTime: true
    };

    onUpdate = jest.fn();
    game = new GameInstance('game-id', 'TEST1', config, host, onUpdate);
  });

  afterEach(() => {
    game.destroy();
    jest.clearAllMocks();
  });

  // --- CORE INITIALIZATION ---
  test('Constructor: correctly initializes state and round-tracking fields', () => {
    expect(game.state.phase).toBe('LOBBY');
    expect(game.state.players[host.clientId]).toMatchObject({
      hasGuessed: false,
      lastGuessCorrect: false
    });
  });

  // --- STARTING & ROUND TRANSITIONS ---
  test('start(): should ignore calls if not in LOBBY', () => {
    game.start(); // Moves to ROUND_PLAYING
    const roundOneSketch = game.state.currentSketch?.id;
    game.start(); // Should do nothing
    expect(game.state.currentRound).toBe(1);
    expect(game.state.currentSketch?.id).toBe(roundOneSketch);
  });

  test('nextRound(): transitions to GAME_OVER after max rounds', () => {
    game.start(); // Round 1
    (game as any).revealRound(); // Round 1 Reveal
    (game as any).nextRound(); // Round 2
    (game as any).revealRound(); // Round 2 Reveal
    (game as any).nextRound(); // Should hit GAME_OVER
    
    expect(game.state.phase).toBe('GAME_OVER');
    expect(game.state.endsAt).toBe(0);
  });

  // --- GUESSING & SCORING ---
  describe('submitGuess() Edge Cases', () => {
    test('Should normalize guesses (case and trim)', () => {
      game.start();
      const correctAnswer = (game as any).activeSketch.name;
      const messyGuess = `  ${correctAnswer.toUpperCase()}  `;
      
      game.submitGuess(host.clientId, messyGuess);
      expect(game.state.players[host.clientId].lastGuessCorrect).toBe(true);
    });

    test('Should award bonus points based on time remaining', () => {
      game.start();
      const correctAnswer = (game as any).activeSketch.name;
      
      // Manually set endsAt to simulate 15s left out of 30s (50% time)
      game.state.endsAt = Date.now() + 15000;
      
      game.submitGuess(host.clientId, correctAnswer);
      const score = game.state.players[host.clientId].score;
      // Base (500) + Bonus (approx 250)
      expect(score).toBeGreaterThan(700);
      expect(score).toBeLessThan(800);
    });

    test('Should block guessing if phase is not ROUND_PLAYING', () => {
      // In LOBBY
      game.submitGuess(host.clientId, 'any');
      expect(game.state.players[host.clientId].hasGuessed).toBe(false);
    });
  });

  // --- PLAYER MANAGEMENT ---
  describe('addPlayer & removePlayer', () => {
    test('removePlayer(): Host leaving in LOBBY handled by external logic, but instance should delete key', () => {
      game.removePlayer(host.clientId);
      expect(game.state.players[host.clientId]).toBeUndefined();
    });

    test('removePlayer(): Round ends early if last remaining player has already guessed', () => {
      game.addPlayer({ ...host, clientId: 'p2' });
      game.start();
      
      game.submitGuess(host.clientId, 'wrong');
      expect(game.state.phase).toBe('ROUND_PLAYING'); // Waiting for p2
      
      game.removePlayer('p2');
      expect(game.state.phase).toBe('ROUND_REVEAL'); // p2 gone, everyone left has guessed
    });
  });

  // --- VIDEO ERRORS & DIFFICULTY ---
  describe('rerollVideoForError()', () => {
    test('rerollVideoForError(): should pick a NEW video and block the old one', () => {
      game.start();
      const badSketchId = (game as any).activeSketch.id;
      
      game.rerollVideoForError(host.clientId, 403);
      
      expect((game as any).activeSketch.id).not.toBe(badSketchId);
      expect((game as any).blockedSketchIds.has(badSketchId)).toBe(true);
      expect(game.state.guessFeed).toContainEqual(expect.objectContaining({
        playerName: 'System'
      }));
    });
  });

  describe('pickRandomSketch() Logic', () => {
    test('Should respect hard difficulty config', () => {
      const hardConfig = { ...config, difficulty: 'hard' as any };
      const hardGame = new GameInstance('g2', 'HARD', hardConfig, host, onUpdate);
      
      const sketch = (hardGame as any).pickRandomSketch();
      expect(sketch.difficulty).toBe('hard');
    });

    test('Should fallback to all sketches if difficulty pool is empty', () => {
      const impossibleConfig = { ...config, difficulty: 'non-existent' as any };
      const fallbackGame = new GameInstance('g3', 'FAIL', impossibleConfig, host, onUpdate);
      
      const sketch = (fallbackGame as any).pickRandomSketch();
      expect(sketch).toBeDefined(); // Falls back to full list
    });
  });

  // --- CONNECTION STATUS ---
  test('setConnectionStatus(): updates status and triggers onUpdate', () => {
    game.setConnectionStatus(host.clientId, false);
    expect(game.state.players[host.clientId].connected).toBe(false);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});