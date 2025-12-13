import React from 'react';

interface GameOverViewProps {
  gameOver: any;
}

export default function GameOverView({ gameOver }: GameOverViewProps) {
  if (!gameOver) return <div>Game Over</div>;
  const { leaderboard } = gameOver;
  return (
    <div>
      <h2>Game Over</h2>
      <h3>Leaderboard</h3>
      <ol>
        {leaderboard && leaderboard.map((entry: any, i: number) => (
          <li key={i}>{entry.playerId}: {entry.score}</li>
        ))}
      </ol>
      <button>Play Again</button>
      <button>Leave</button>
    </div>
  );
}
