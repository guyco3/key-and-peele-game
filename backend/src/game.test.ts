import { GameInstance } from './game';
import { GameConfig, Player } from '../../shared';
import { SKETCHES } from '../../shared/sketches';

// Mock the sketches data so we have predictable IDs to test against
jest.mock('../../shared/sketches', () => ({
  SKETCHES: [
    { id: '1', name: 'Substitute Teacher', youtubeId: 'vid1', description: 'A-A-Ron', tags: ['school'] },
    { id: '2', name: 'East West Bowl', youtubeId: 'vid2', description: 'Names', tags: ['sports'] },
    { id: '3', name: 'Continental Breakfast', youtubeId: 'vid3', description: 'Luxury', tags: ['hotel'] },
  ]
}));

const mockConfig: GameConfig = {
  numRounds: 2,
  clipLength: 5,
  roundLength: 30,
  roundEndLength: 10,
};

describe('GameInstance: New Implementation Tests', () => {
  let game: GameInstance;
  let host: Player;
  let updateFn: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    updateFn = jest.fn();
    host = { clientId: 'H1', name: 'Guy', score: 0, connected: true, hasGuessed: false, lastGuessCorrect: false, lastGuessSketch: '' };
    game = new GameInstance('g1', 'ROOM', mockConfig, host, updateFn);
  });

  afterEach(() => {
    game.destroy();
    jest.clearAllTimers();
  });

  test('Anti-Cheat: Data Masking hides answers during PLAYING phase', () => {
    game.start();
    
    // In ROUND_PLAYING, currentSketch should NOT have name or description
    expect(game.state.phase).toBe('ROUND_PLAYING');
    expect(game.state.currentSketch?.youtubeId).toBeDefined();
    expect(game.state.currentSketch?.name).toBeUndefined();
    expect(game.state.currentSketch?.description).toBeUndefined();

    // Move to REVEAL
    jest.advanceTimersByTime(mockConfig.roundLength * 1000);
    
    // Now the full data should be present
    expect(game.state.phase).toBe('ROUND_REVEAL');
    expect(game.state.currentSketch?.name).toBeDefined();
    expect(game.state.currentSketch?.description).toBeDefined();
  });

  test('Error Recovery: Reroll adds sketch to blocked set and resets timer', () => {
    game.start();
    const firstSketchId = game.state.currentSketch?.id;
    const initialEndsAt = game.state.endsAt;

    // Simulate a video error
    jest.advanceTimersByTime(5000); // 5 seconds into the round
    game.rerollVideoForError('H1', 150);

    // 1. Should have a new sketch
    expect(game.state.currentSketch?.id).not.toBe(firstSketchId);
    
    // 2. Timer should have reset to the full round length
    // (endsAt should be roughly current time + 30s)
    expect(game.state.endsAt).toBeGreaterThan(initialEndsAt);
    
    // 3. System message should be in the feed
    const systemMsg = game.state.guessFeed.find(m => m.playerName === 'System');
    expect(systemMsg?.text).toContain('Video blocked');
  });

  test('Scoring: Normalized strings and speed bonus calculation', () => {
    game.start();
    // We don't know which sketch was picked due to random, 
    // but we can "cheat" the test by checking our private activeSketch
    const actualName = (game as any).activeSketch.name;

    // Submit a guess with messy casing and spacing
    game.submitGuess('H1', `  ${actualName.toUpperCase()}   `);

    expect(game.state.players['H1'].hasGuessed).toBe(true);
    expect(game.state.players['H1'].score).toBeGreaterThanOrEqual(500);
    expect(game.state.guessFeed[0].isCorrect).toBe(true);
  });
});