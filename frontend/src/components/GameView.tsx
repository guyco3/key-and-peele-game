import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { Podium } from './Podium';

export const GameView: React.FC = () => {
  const { gameState, leaveGame, clientId } = useGame();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(scrolled > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!gameState) return null;

  const me = gameState.players[clientId];
  const isPlaying = gameState.phase === 'ROUND_PLAYING';
  const isReveal = gameState.phase === 'ROUND_REVEAL'; // Helper for reveal phase
  const isGameOver = gameState.phase === 'GAME_OVER';

  return (
    <div className="game-screen-wrapper">
      {showScrollTop && (
        <button className="back-to-top-chalk" onClick={scrollToTop} aria-label="Back to top">
          <span className="arrow">↑</span>
          <span className="text">TOP</span>
        </button>
      )}

      {/* Confirm leave keyboard handler */}
      {confirmLeaveOpen && typeof window !== 'undefined' && (
        <ConfirmLeaveKeyHandler onClose={() => setConfirmLeaveOpen(false)} />
      )}

      <nav className="game-navbar">
        <div className="nav-left">
          <button
            className="leaderboard-btn"
            onClick={() => setLeaderboardOpen(true)}
            aria-label="Open leaderboard"
          >
            🏆
          </button>

          <div className="player-hud-card">
             <span className="hud-score">{me?.score || 0}</span>
             <span className="hud-name">{me?.name}</span>
          </div>
        </div>
        <div className="nav-center">
           <div className="round-hud">{isGameOver ? "GAME OVER" : `ROUND ${gameState.currentRound}`}</div>
           {!isGameOver && <Timer />}
        </div>
        <div className="nav-right">
          <button className="leave-btn-nav" onClick={() => setConfirmLeaveOpen(true)} aria-label="Quit">x</button>
        </div>
      </nav>

      <div className="game-layout">
        {!isGameOver && (
          <aside className="sidebar-search-desktop">
            {isPlaying && !me?.hasGuessed ? <SketchSearch /> : (
              <div className="waiting-chalk">
                {me?.hasGuessed && (
                  <div className="status-notice-under">
                    <div className="your-guess-chalk">You guessed "{me.lastGuessSketch}"</div>
                    {me.lastGuessCorrect ? (
                        <div className="success-notice chalk-textured-text">CORRECT!</div>
                    ) : (
                        <div className="failure-notice chalk-textured-text" style={{color: '#ff4444'}}>INCORRECT</div>
                    )}

                    {/* 📒 REVEAL INFO IN SIDEBAR (Desktop Only) */}
                    {isReveal && (
                      <div className="sidebar-sketch-reveal">
                        <h3 className="chalk-textured-text">{gameState.currentSketch?.name}</h3>
                        <p className="chalk-description">{gameState.currentSketch?.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        <main className={`main-classroom ${isGameOver ? 'full-width' : ''}`}>
          <div className="board-container">
            {isGameOver ? <Podium /> : (
              <>
                <section className="video-container-centered">
                  <div className="video-frame">
                    <VideoPlayer />
                  </div>
                  {/* 📺 REVEAL INFO UNDER VIDEO (Mobile Only) */}
                  {isReveal && (
                    <div className="sketch-reveal mobile-only-reveal">
                      <h3 className="chalk-textured-text">{gameState.currentSketch?.name}</h3>
                      <p className="chalk-description">{gameState.currentSketch?.description}</p>
                    </div>
                  )}
                </section>

                <section className="mobile-search-panel">
                  {isPlaying && !me?.hasGuessed ? <SketchSearch /> : (
                    <div className="waiting-chalk" style={{ marginTop: '20px' }}>
                      {me?.hasGuessed ? (
                         <div className="status-notice-under">
                            <div className="your-guess-chalk">You guessed "{me.lastGuessSketch}"</div>
                            {me.lastGuessCorrect ? (
                                <div className="success-notice chalk-textured-text">CORRECT!</div>
                            ) : (
                                <div className="failure-notice chalk-textured-text" style={{color: '#ff4444'}}>INCORRECT</div>
                            )}
                         </div>
                      ) : "PREPARING NEXT ROUND..."}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <Leaderboard isModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      {confirmLeaveOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setConfirmLeaveOpen(false); }}>
          <div className="modal">
            <h3>Confirm Leave</h3>
            <p>Are you sure you want to leave the game? You will be removed from the room.</p>
            <div className="modal-actions">
              <button className="btn-host" onClick={() => setConfirmLeaveOpen(false)}>Cancel</button>
              <button className="leave-btn-nav" onClick={() => { setConfirmLeaveOpen(false); leaveGame(); }}>Quit Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Small helper component to handle Escape key for the confirm modal
const ConfirmLeaveKeyHandler: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return null;
};