import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Leaderboard: React.FC<{ horizontal?: boolean }> = ({ horizontal }) => {
  const { gameState, clientId } = useGame();
  const [collapsed, setCollapsed] = useState(false);

  if (!gameState) return null;

  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);

  return (
    <div className={`leaderboard ${horizontal ? 'horizontal-mode' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="leaderboard-header">
        <h3>Standings</h3>
        <button className="leaderboard-toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
          {collapsed ? '▸' : '▾'}
        </button>
      </div>

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