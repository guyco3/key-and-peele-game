import React from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';

export const GameView: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;

  return (
    <div className="game-layout">
      <aside className="sidebar">
        <Leaderboard />
      </aside>

      <main className="content">
        <header className="top-bar">
          <div className="round-counter">Round {gameState.currentRound}</div>
          <Timer />
        </header>

        <section className="video-section">
          <VideoPlayer />
          
          {gameState.phase === 'ROUND_REVEAL' && (
            <div className="reveal-overlay">
              <h2>{gameState.currentSketch?.name}</h2>
              <p>{gameState.currentSketch?.description}</p>
            </div>
          )}
        </section>

        <footer className="interaction-section">
          {gameState.phase === 'ROUND_PLAYING' && <SketchSearch />}
          {gameState.phase === 'GAME_OVER' && <h2>Final Results! 🏆</h2>}
        </footer>
      </main>
    </div>
  );
};