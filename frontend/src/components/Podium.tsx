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
  // Decide rendering order so first place is centered when possible
  const order = winners.length === 3 ? [2, 1, 3] : winners.length === 2 ? [2, 1] : [1];

  const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : '3rd');

  return (
    <div className="podium-container">
      <h1>Final Results 🏆</h1>
      <div className={`podium-grid count-${winners.length}`}>
        {order.map((place) => {
          const player = winners[place - 1];
          if (!player) return null;
          return (
            <div key={player.clientId} className={`podium-place place-${place}`} aria-label={`${ordinal(place)} place`}>
              <div className="podium-top">
                <div className="medal">{medals[place - 1]}</div>
                <div className="position-label">{ordinal(place)}</div>
              </div>
              <div className="podium-body">
                <div className="podium-name">{player.name}</div>
                <div className="podium-score">{player.score.toLocaleString()} pts</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};