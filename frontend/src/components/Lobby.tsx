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
        <h2 className="chalk-textured-text">Room Code: <span className="highlight">{roomCode}</span></h2>
        <p className="chalk-description">Players are being written onto the board...</p>
      </header>

      <div className="player-list-chalk">
        {players.map(p => (
          <div key={p.clientId} className={`chalk-player ${p.clientId === clientId ? 'is-me' : ''}`}>
            <span className="chalk-player-name chalk-textured-text">{p.name} {p.clientId === gameState.hostId && "👑"}</span>
          </div>
        ))}
      </div>

      <div className="lobby-actions">
        <button className="leave-btn" onClick={leaveGame}>Quit Room</button>

        {isHost ? (
          <button className="start-btn" onClick={handleStart} disabled={players.length < 1}>
            START GAME ({players.length} Players)
          </button>
        ) : (
          <div className="wait-status">The host will start the game soon...</div>
        )}
      </div>
    </div>
  );
};