import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export const GuessFeed: React.FC = () => {
  const { gameState } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever a new guess arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.guessFeed.length]);

  if (!gameState) return null;

  return (
    <div className="guess-feed-container">
      <h4>Activity</h4>
      <div className="guess-list" ref={scrollRef}>
        {gameState.guessFeed.map((guess, index) => (
          <div 
            key={index} 
            className={`guess-item ${guess.isCorrect ? 'is-correct' : 'is-wrong'}`}
          >
            <span className="player-name">{guess.playerName}</span>
            <span className="guess-text">
              {guess.isCorrect ? " guessed correctly! 🎉" : `: ${guess.text}`}
            </span>
          </div>
        ))}
        {gameState.guessFeed.length === 0 && (
          <div className="empty-feed">No guesses yet...</div>
        )}
      </div>
    </div>
  );
};