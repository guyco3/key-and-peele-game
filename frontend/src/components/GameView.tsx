import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { SwipeableDrawer, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { Podium } from './Podium';

export const GameView: React.FC = () => {
  const { gameState, leaveGame, clientId } = useGame();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  if (!gameState) return null;

  const me = gameState.players[clientId];
  const isPlaying = gameState.phase === 'ROUND_PLAYING';
  const isGameOver = gameState.phase === 'GAME_OVER'; // Added check

  return (
    <div className="game-screen-wrapper">
      {/* 🟢 NAVBAR stays visible even at game over */}
      <nav className="game-navbar">
        <div className="nav-left">
          <div className="player-hud-card" onClick={() => setLeaderboardOpen(true)}>
             <span className="hud-score">{me?.score || 0}</span>
             <span className="hud-name">{me?.name}</span>
          </div>
        </div>

        <div className="nav-center">
           <div className="round-hud">
             {isGameOver ? "GAME OVER" : `ROUND ${gameState.currentRound}`}
           </div>
           {!isGameOver && <Timer />}
        </div>

        <div className="nav-right">
          <button 
            className="search-trigger-mobile" 
            onClick={() => setMobileSearchOpen(true)}
            disabled={!isPlaying || me?.hasGuessed}
          >
            <SearchIcon />
          </button>
          <button className="leave-btn-nav" onClick={leaveGame}>Quit</button>
        </div>
      </nav>

      <div className="game-layout">
        {/* 📒 HIDE SEARCH SIDEBAR ON GAME OVER */}
        {!isGameOver && (
          <aside className="sidebar-search-desktop">
            <h3 className="chalk-textured-text">SKETCH SEARCH</h3>
            {isPlaying && !me?.hasGuessed ? <SketchSearch /> : (
              <div className="waiting-chalk">
                {me?.hasGuessed ? "GUESS LOCKED IN" : "PREPARING NEXT ROUND..."}
              </div>
            )}
          </aside>
        )}

        <main className={`main-classroom ${isGameOver ? 'full-width' : ''}`}>
          <div className="board-container">
            {/* 🏆 RENDER PODIUM IF GAME OVER */}
            {isGameOver ? (
              <Podium />
            ) : (
              /* 🎮 OTHERWISE RENDER ACTIVE GAME */
              <>
                <section className="video-container-centered">
                  <div className="video-frame">
                    <VideoPlayer />
                  </div>
                  {gameState.phase === 'ROUND_REVEAL' && (
                    <div className="sketch-reveal">
                      <h3 className="chalk-textured-text">{gameState.currentSketch?.name}</h3>
                      <p className="chalk-description">{gameState.currentSketch?.description}</p>
                    </div>
                  )}
                </section>
                {me?.hasGuessed && isPlaying && (
                  <div className="status-notice-under">
                    <div className="your-guess-chalk">You guessed "{me.lastGuessSketch}"</div>
                    {me.lastGuessCorrect ? (
                        <div className="success-notice chalk-textured-text">CORRECT!</div>
                    ) : (
                        <div className="failure-notice chalk-textured-text" style={{color: '#ff4444'}}>INCORRECT</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <SwipeableDrawer
        anchor="left"
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        onOpen={() => setMobileSearchOpen(true)}
        PaperProps={{
          sx: { width: '100%', height: '100%', backgroundColor: '#0e2a1d', padding: '20px', display: 'flex', flexDirection: 'column' }
        }}
      >
        <div className="drawer-search-header">
          <h3 className="chalk-textured-text">SEARCH</h3>
          <IconButton onClick={() => setMobileSearchOpen(false)} sx={{color: 'white'}}><CloseIcon /></IconButton>
        </div>
        <div className="drawer-search-body" style={{ flex: 1, overflow: 'hidden' }}>
          <SketchSearch onSelect={() => setMobileSearchOpen(false)} />
        </div>
      </SwipeableDrawer>

      <Leaderboard isModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </div>
  );
};