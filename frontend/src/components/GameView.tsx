import React from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { GuessFeed } from './GuessFeed';
import { Podium } from './Podium';

export const GameView: React.FC = () => {
  const { gameState, leaveGame, clientId } = useGame();

  // 🛡️ Safety Check
  if (!gameState) return null;

  const isGameOver = gameState.phase === 'GAME_OVER';

  return (
    <div className="game-layout">
      {/* 📒 SIDEBAR: The Teacher's Record Book */}
      <aside className="sidebar-classroom">
        <div className="sidebar-scroll-area">
          <Leaderboard />

          {/* Search moved into sidebar — under the leaderboard */}
          <div className="sidebar-search-wrapper">
          {gameState.phase === 'ROUND_PLAYING' && !gameState.players[clientId]?.hasGuessed && (
            <div className="search-wrapper-chalk">
              <SketchSearch />
            </div>
          )}
</div>
        </div>

        
      </aside>

      {/* Exit button moved out of the sidebar so it can be fixed to the top-right */}
      <button className="leave-btn exit-top-right" onClick={leaveGame}>
        Quit 
      </button>

      {/* 🏫 MAIN STAGE: The Chalkboard Content */}
      <main className="main-classroom">
        {isGameOver ? (
          /* 🏆 GAME OVER: Show the Final Results (The Podium) */
          <div className="board-container">
            <Podium />
          </div>
        ) : (
          /* 🎮 ACTIVE PLAY: Show Video and Search */
          <div className="board-container">
            <header className="board-header">
              <div className="round-info">
                <span className="chalk-label">ROUND</span>
                <span className="chalk-value">{gameState.currentRound}</span>
              </div>
              <Timer />
            </header>

            <div className="stage-area">
                  <section className="video-container-centered">
                    <div className="video-frame">
                      <VideoPlayer />
                    </div>

                    {/* Show sketch name & description under the video when revealing */}
                    {gameState.phase === 'ROUND_REVEAL' && (
                      <div className="sketch-reveal">
                        <h3 className="chalk-textured-text">{gameState.currentSketch?.name}</h3>
                        <p className="chalk-description">{gameState.currentSketch?.description}</p>
                      </div>
                    )}

                    {/* Guess feed shown under the video (vertical, scrollable) - hidden during reveal */}
                    {/* {gameState.phase !== 'ROUND_REVEAL' && (
                      <div className="guess-feed-under-video">
                        <GuessFeed />
                      </div>
                    )} */}
                  </section>

                  {/* ✍️ INPUT: The Wide Chalk Underline is now in the left column */}
                  <footer className="search-footer">
                    {gameState.phase === 'ROUND_PLAYING' && gameState.players[clientId]?.hasGuessed && (
                      <div className="status-notice">
                        <div className="your-guess-chalk">
                          You guessed "{gameState.players[clientId].lastGuessSketch}"
                        </div>

                        {/* Read correctness directly from the player object */}
                        {gameState.players[clientId].lastGuessCorrect ? (
                          <div className="success-notice chalk-textured-text">PRESENT! (Correct)</div>
                        ) : (
                          <div className="failure-notice chalk-textured-text" style={{ color: '#ff4444' }}>
                            OUT! (Incorrect)
                          </div>
                        )}
                      </div>
                    )}
                  </footer>
                </div>
          </div>
        )}
      </main>
    </div>
  );
};