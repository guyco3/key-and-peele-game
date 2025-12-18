import React from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { GuessFeed } from './GuessFeed';
import { Podium } from './Podium'; // 👈 Import new component

export const GameView: React.FC = () => {
  const { gameState, leaveGame } = useGame();

  if (!gameState) return null;

  const isGameOver = gameState.phase === 'GAME_OVER';

  return (
    <div className="game-layout">
      <aside className="sidebar">
        <Leaderboard />
        <GuessFeed />
        <div className="sidebar-footer">
          <button className="leave-btn-small" onClick={leaveGame}>
            Leave Game
          </button>
        </div>
      </aside>

      <main className="content">
        {isGameOver ? (
          /* 🏆 SHOW THIS AT THE END */
          <Podium />
        ) : (
          /* 🎮 SHOW THIS DURING PLAY */
          <>
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
            </footer>
          </>
        )}
      </main>
    </div>
  );
};