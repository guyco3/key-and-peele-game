import React from "react";
import { Player } from "../context/GameContext";

interface PlayerListProps {
  players: Record<string, Player>;
  hostId?: string;
  currentId?: string;
  showScores?: boolean;
}

export default function PlayerList({ players, hostId, currentId, showScores = true }: PlayerListProps) {
  const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="eyebrow">Lineup</div>
          <h3>Players</h3>
        </div>
        <span className="pill">Total: {sortedPlayers.length}</span>
      </div>
      <ul className="list">
        {sortedPlayers.map(([id, p]) => (
          <li key={id} className="player-tile">
            <div className="player-meta">
              <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
              <div className="stack">
                <strong>{p.name}</strong>
                <div className="chip-row">
                  {hostId === id && <span className="tag">Host</span>}
                  {currentId === id && <span className="tag">You</span>}
                </div>
              </div>
            </div>
            {showScores && <span className="score">{p.score ?? 0} pts</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
