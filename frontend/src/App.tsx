// src/App.tsx
import React from 'react';
import { useGame } from './context/GameContext';
import { JoinForm } from './components/JoinForm';
import { Lobby } from './components/Lobby';
import { GameView } from './components/GameView';

const App: React.FC = () => {
  const { gameState, roomCode } = useGame();

  if (!gameState && !roomCode) return <JoinForm />;
  
  if (!gameState) return <div className="loading-screen">Syncing...</div>;

  // 🛡️ WAIT FOR FIRST SKETCH: If the game has started but no sketch is synced yet
  if (gameState.phase !== 'LOBBY' && !gameState.currentSketch?.youtubeId) {
    return <div className="loading-screen">Preparing Round...</div>;
  }

  if (gameState.phase === 'LOBBY') return <Lobby />;
  
  return <GameView />;
};

export default App;