import React from 'react';
import { useGame } from '../context/GameContext';

export const Podium: React.FC = () => {
  const { gameState, leaveGame } = useGame();
  if (!gameState) return null;

  // Get top 3 players
  const winners = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="podium-container">
      <h1>Final Results 🏆</h1>
      <div className="podium-grid">
        {winners.map((player, index) => (
          <div key={player.clientId} className={`podium-place place-${index + 1}`}>
            <div className="medal">{medals[index]}</div>
            <div className="podium-name">{player.name}</div>
            <div className="podium-score">{player.score.toLocaleString()} pts</div>
          </div>
        ))}
      </div>
      
      {/* <div className="podium-actions">
        <button className="leave-btn" onClick={leaveGame}>
          Back to Menu
        </button>
      </div> */}
    </div>
  );
};