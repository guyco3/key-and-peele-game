import { GameInstance } from '../../src/game';
import { Player, GameConfig } from '../../../shared';

// 1. Mock Logger
jest.mock('../../src/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// 2. Mock Sketches
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

  // --- ACTIVITY TRACKING (GC PROTECTION) ---
  describe('Activity Tracking (lastActivityAt)', () => {
    /**
     * Helper to "age" the game activity manually for testing
     */
    const ageGame = (ms: number) => {
      game.lastActivityAt = Date.now() - ms;
    };

    test('should update lastActivityAt when game starts', () => {
      ageGame(10000);
      const pastTime = game.lastActivityAt;
      game.start();
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });

    test('should update lastActivityAt when a player joins', () => {
      ageGame(10000);
      const pastTime = game.lastActivityAt;
      game.addPlayer({ ...host, clientId: 'p2' });
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });

    test('should update lastActivityAt when a guess is submitted', () => {
      game.start();
      ageGame(10000);
      const pastTime = game.lastActivityAt;
      game.submitGuess(host.clientId, 'wrong');
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });

    test('should update lastActivityAt on phase transitions', () => {
      game.start(); // Transition to ROUND_PLAYING
      ageGame(10000);
      const pastTime = game.lastActivityAt;
      
      // Force a transition to REVEAL
      (game as any).revealRound();
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });

    test('should update lastActivityAt when connection status changes', () => {
      ageGame(10000);
      const pastTime = game.lastActivityAt;
      game.setConnectionStatus(host.clientId, false);
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });
  });

  // --- CORE INITIALIZATION ---
  test('Constructor: correctly initializes state and activity timer', () => {
    expect(game.state.phase).toBe('LOBBY');
    expect(game.lastActivityAt).toBeCloseTo(Date.now(), -2); // Check it was just set
    expect(game.state.players[host.clientId]).toMatchObject({
      hasGuessed: false,
      lastGuessCorrect: false
    });
  });

  // --- GUESSING & SCORING ---
  describe('submitGuess() Edge Cases', () => {
    test('Should award bonus points and update activity', () => {
      game.start();
      const correctAnswer = (game as any).activeSketch.name;
      const initialActivity = game.lastActivityAt;
      
      game.state.endsAt = Date.now() + 15000;
      
      game.submitGuess(host.clientId, correctAnswer);
      expect(game.state.players[host.clientId].score).toBeGreaterThan(500);
      expect(game.lastActivityAt).toBeGreaterThanOrEqual(initialActivity);
    });

    test('Should block guessing if phase is not ROUND_PLAYING', () => {
      game.submitGuess(host.clientId, 'any');
      expect(game.state.players[host.clientId].hasGuessed).toBe(false);
    });
  });

  // --- PLAYER MANAGEMENT ---
  describe('addPlayer & removePlayer', () => {
    test('removePlayer(): should update lastActivityAt and remove key', () => {
      const pastTime = Date.now() - 5000;
      game.lastActivityAt = pastTime;
      
      game.removePlayer(host.clientId);
      expect(game.state.players[host.clientId]).toBeUndefined();
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    });

    test('removePlayer(): Round ends early if last remaining player has already guessed', () => {
      game.addPlayer({ ...host, clientId: 'p2' });
      game.start();
      
      game.submitGuess(host.clientId, 'wrong');
      expect(game.state.phase).toBe('ROUND_PLAYING');
      
      game.removePlayer('p2');
      expect(game.state.phase).toBe('ROUND_REVEAL');
    });
  });

  // --- VIDEO ERRORS ---
  describe('rerollVideoForError()', () => {
    test('should update lastActivityAt when video is rerolled', () => {
      game.start();
      const pastTime = Date.now() - 5000;
      game.lastActivityAt = pastTime;
      
      game.rerollVideoForError(host.clientId, 403);
      
      expect(game.lastActivityAt).toBeGreaterThan(pastTime);
      expect(game.state.guessFeed[0].playerName).toBe('System');
    });
  });

  // --- CONNECTION STATUS ---
  test('setConnectionStatus(): updates status and activity', () => {
    const pastTime = Date.now() - 1000;
    game.lastActivityAt = pastTime;
    
    game.setConnectionStatus(host.clientId, false);
    expect(game.state.players[host.clientId].connected).toBe(false);
    expect(game.lastActivityAt).toBeGreaterThan(pastTime);
    expect(onUpdate).toHaveBeenCalled();
  });
});