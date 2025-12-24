import React from 'react';
import { useGame } from './context/GameContext';
import { GameView } from './components/GameView';
import { JoinForm } from './components/JoinForm';
import { Lobby } from './components/Lobby';
import { BuyMeACoffee } from './components/BuyMeACofee';

const App: React.FC = () => {
  const { gameState, roomCode } = useGame();

  return (
    <>
      {!gameState && !roomCode && 
      <>
      <nav
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <a
          href="https://www.buymeacoffee.com/guyco3"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.5rem",
          }}
        >
          ☕ Support this Project
        </a>
      </nav>

        <JoinForm />
      </>
      }
      {!gameState && roomCode && <div className="loading-screen">Syncing...</div>}
      {gameState?.phase === 'LOBBY' && <Lobby />}
      {gameState?.phase && gameState.phase !== 'LOBBY' && <GameView />}
      
      {/* Keep the widget script running globally */}
      <BuyMeACoffee />
    </>
  );
};

export default App;