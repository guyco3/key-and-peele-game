import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import { GameView } from './components/GameView';
import { JoinForm } from './components/JoinForm';
import { Lobby } from './components/Lobby';
import { InfoPage } from './components/InfoPage';
import { BuyMeACoffee } from './components/BuyMeACofee';

const App: React.FC = () => {
  const { gameState, roomCode } = useGame();

  return (
    <Router>
      <Routes>
        {/* Main Game Logic Path */}
        <Route path="/" element={
          <>
            {!gameState && !roomCode && <JoinForm />}
            {!gameState && roomCode && <div className="loading-screen">Syncing...</div>}
            {gameState?.phase === 'LOBBY' && <Lobby />}
            {gameState?.phase && gameState.phase !== 'LOBBY' && <GameView />}
          </>
        } />

        {/* Dedicated Info Path */}
        <Route path="/info" element={<InfoPage />} />
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <BuyMeACoffee />
    </Router>
  );
};

export default App;