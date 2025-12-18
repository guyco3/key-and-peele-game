import React from 'react';
import { useGame } from '../context/GameContext';

export const Lobby: React.FC = () => {
  const { gameState, socket, clientId, roomCode, leaveGame } = useGame();

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const isHost = gameState.hostId === clientId;

  const handleStart = () => {
    socket?.emit('start_game', { roomCode, clientId });
  };

  return (
    <div className="lobby-container">
      <header>
        <h2>Room Code: <span className="highlight">{roomCode}</span></h2>
        <p>Waiting for players to join...</p>
      </header>

      <button className="leave-btn" onClick={leaveGame}>
        Quit Room
    </button>

      <div className="player-grid">
        {players.map(p => (
          <div key={p.clientId} className={`player-card ${p.clientId === clientId ? 'is-me' : ''}`}>
            <span className="avatar">👤</span>
            <span className="name">{p.name} {p.clientId === gameState.hostId && "👑"}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button className="start-btn" onClick={handleStart} disabled={players.length < 1}>
          START GAME ({players.length} Players)
        </button>
      ) : (
        <div className="wait-status">The host will start the game soon...</div>
      )}
    </div>
  );
};