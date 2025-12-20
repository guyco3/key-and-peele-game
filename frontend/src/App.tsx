import React from 'react';
import { useGame } from './context/GameContext';
import { GameView } from './components/GameView';
import { JoinForm } from './components/JoinForm';
import { Lobby } from './components/Lobby';

const App: React.FC = () => {
  const { gameState, roomCode } = useGame();

  if (!gameState && !roomCode) return <JoinForm />;
  if (!gameState) return <div className="loading-screen">Syncing...</div>;

  if (gameState.phase === 'LOBBY') return <Lobby />;
  
  return <GameView />;
};

export default App;