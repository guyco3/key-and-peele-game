import React from "react";
import { useGameState } from "../context/GameContext";

export default function GameOverScreen() {
  const game = useGameState();

  const handleLeaveGame = () => {
    game.clearGameData();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Game Over</h2>
      <h3>Final Scores:</h3>
      <ul>
        {Object.entries(game.scores).map(([id, p]) => (
          <li key={id}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>
      <button onClick={handleLeaveGame} style={{ marginTop: 20, padding: "8px 16px" }}>
        Leave Game
      </button>
    </div>
  );
}
