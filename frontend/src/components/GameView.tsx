import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { SwipeableDrawer, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

export const GameView: React.FC = () => {
  const { gameState, leaveGame, clientId } = useGame();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  if (!gameState) return null;

  const me = gameState.players[clientId];
  const isPlaying = gameState.phase === 'ROUND_PLAYING';

  return (
    <div className="game-screen-wrapper">
      {/* 🟢 TOP NAVBAR */}
      <nav className="game-navbar">
        <div className="nav-left">
          <div className="player-hud-card" onClick={() => setLeaderboardOpen(true)}>
             <span className="hud-score">{me?.score || 0}</span>
             <span className="hud-name">{me?.name}</span>
          </div>
        </div>

        <div className="nav-center">
           <div className="round-hud">ROUND {gameState.currentRound}</div>
           <Timer />
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
        <aside className="sidebar-search-desktop">
          <h3 className="chalk-textured-text">SKETCH SEARCH</h3>
          {isPlaying && !me?.hasGuessed ? <SketchSearch /> : (
            <div className="waiting-chalk">
              {me?.hasGuessed ? "GUESS LOCKED IN" : "PREPARING NEXT ROUND..."}
            </div>
          )}
        </aside>

        <main className="main-classroom">
          <div className="board-container">
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
          </div>
        </main>
      </div>

      {/* 📱 MOBILE SEARCH DRAWER - Updated for Full Height */}
      <SwipeableDrawer
        anchor="left"
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        onOpen={() => setMobileSearchOpen(true)}
        PaperProps={{
          sx: { 
            width: '100%', // Full width on mobile often feels better for search
            height: '100%', // Force full vertical height
            backgroundColor: '#0e2a1d', 
            padding: '20px', 
            backgroundImage: 'none', 
            borderRight: 'none',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <div className="drawer-search-header">
          <h3 className="chalk-textured-text">SEARCH</h3>
          <IconButton onClick={() => setMobileSearchOpen(false)} sx={{color: 'white'}}>
            <CloseIcon />
          </IconButton>
        </div>
        {/* Wrap in a flex container to let the list take up remaining space */}
        <div className="drawer-search-body" style={{ flex: 1, overflow: 'hidden' }}>
          <SketchSearch onSelect={() => setMobileSearchOpen(false)} />
        </div>
      </SwipeableDrawer>

      <Leaderboard isModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </div>
  );
};