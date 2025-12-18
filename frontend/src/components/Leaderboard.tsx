import React from 'react';
import { useGame } from '../context/GameContext';

export const Leaderboard: React.FC = () => {
  const { gameState, clientId } = useGame();

  if (!gameState) return null;

  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard">
      <h3>Standings</h3>
      <div className="player-list">
        {sortedPlayers.map((p, idx) => (
          <div key={p.clientId} className={`leaderboard-row ${p.clientId === clientId ? 'me' : ''}`}>
            <span className="rank">#{idx + 1}</span>
            <span className="name">{p.name}</span>
            <span className="score">{p.score}</span>
            <span className="status">
              {p.hasGuessed ? "✅" : "⏳"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};