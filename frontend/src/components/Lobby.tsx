import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Lobby: React.FC = () => {
  const { gameState, socket, clientId, roomCode, leaveGame } = useGame();

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const isHost = gameState.hostId === clientId;

  const handleStart = () => {
    socket?.emit('start_game', { roomCode, clientId });
  };

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?roomCode=${encodeURIComponent(roomCode)}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      // swallow — copy failure isn't blocking
      console.warn('copy failed', err);
    }
  };

  return (
    <div className="lobby-container">
      <header>
        <h2 className="chalk-textured-text">Room Code: <span className="highlight">{roomCode}</span></h2>
        <p className="chalk-description">Players</p>
      </header>

      <div className="player-list-chalk">
        {players.map(p => (
          <div key={p.clientId} className={`chalk-player ${p.clientId === clientId ? 'is-me' : ''}`}>
            <span className="chalk-player-name chalk-textured-text">{p.name} {p.clientId === gameState.hostId && "(host)"}</span>
          </div>
        ))}
      </div>

      <div className="lobby-actions">
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <button className="leave-btn" onClick={leaveGame}>Quit Room</button>
          <button className="leave-btn" onClick={handleShare}>
            {copied ? 'Link Copied!' : 'Share Link'}
          </button>
        </div>

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