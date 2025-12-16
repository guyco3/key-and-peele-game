import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { GameProvider, useGameState } from "./context/GameContext";
import { useSocket } from "./hooks/useSocket";
import LandingScreen from "./screens/LandingScreen";
import LobbyScreen from "./screens/LobbyScreen";
import RoundScreen from "./screens/RoundScreen";
import RoundEndScreen from "./screens/RoundEndScreen";
import GameOverScreen from "./screens/GameOverScreen";

function GameRouter() {
  const game = useGameState();
  const navigate = useNavigate();
  
  useSocket(); // Initialize socket listeners

  // Navigate to appropriate route based on game status
  useEffect(() => {
    if (game.status === "landing") {
      navigate("/");
    } else if (game.gameId) {
      const expectedPath = `/${game.gameId}/${game.status.replace("_", "-")}`;
      const currentPath = window.location.pathname;
      
      if (currentPath !== expectedPath) {
        navigate(expectedPath);
      }
    }
  }, [game.status, game.gameId, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/:gameId/lobby" element={<LobbyScreen />} />
      <Route path="/:gameId/round" element={<RoundScreen />} />
      <Route path="/:gameId/round-end" element={<RoundEndScreen />} />
      <Route path="/:gameId/game-over" element={<GameOverScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <GameRouter />
      </GameProvider>
    </BrowserRouter>
  );
}
