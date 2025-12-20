import React from "react";
import { useGameState } from "../context/GameContext";

export default function GameOverScreen() {
  const game = useGameState();
  const leaderboard = Object.entries(game.scores).sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));

  const handleLeaveGame = () => {
    game.clearGameData();
  };

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Room {game.roomId || "Game over"}</span>
                <strong>Final scoreboard</strong>
              </div>
            </div>
            <h1>Game over — bragging rights awarded.</h1>
            <p>Thanks for playing. Queue another round any time.</p>
          </div>
          <button className="btn btn-primary" onClick={handleLeaveGame}>
            Leave game
          </button>
        </div>

        <div className="card card--bright">
          <div className="card-header">
            <div>
              <div className="eyebrow">Winners</div>
              <h3>Final scores</h3>
            </div>
            {leaderboard[0] && (
              <span className="pill pill--success">
                🏆 {leaderboard[0][1].name} wins
              </span>
            )}
          </div>
          <ul className="list">
            {leaderboard.map(([id, p], index) => (
              <li key={id} className="player-tile">
                <div className="player-meta">
                  <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
                  <div className="stack">
                    <strong>{index === 0 ? `🏆 ${p.name}` : p.name}</strong>
                    <span className="muted">Client {p.clientId.slice(0, 6)}</span>
                  </div>
                </div>
                <span className="score">{p.score} pts</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
