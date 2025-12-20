// src/App.tsx
import React from 'react';
import { useGame } from './context/GameContext';
import { JoinForm } from './components/JoinForm';
import { Lobby } from './components/Lobby';
import { GameView } from './components/GameView';
import TopBar from './components/TopBar';

import { Box } from '@mui/material';

const App: React.FC = () => {
  const { gameState, roomCode } = useGame();

  if (!gameState && !roomCode) return <JoinForm />;

  if (!gameState) return <div className="loading-screen">Syncing...</div>;

  // 🛡️ WAIT FOR FIRST SKETCH: If the game has started but no sketch is synced yet
  if (gameState.phase !== 'LOBBY' && !gameState.currentSketch?.youtubeId) {
    return <div className="loading-screen">Preparing Round...</div>;
  }

  if (gameState.phase === 'LOBBY') return (
    <>
      <TopBar />
      <Lobby />
    </>
  );

  return (
    <>
      <TopBar />
      <Box sx={{ pt: 1 }}>
        <GameView />
      </Box>
    </>
  );
};

export default App;