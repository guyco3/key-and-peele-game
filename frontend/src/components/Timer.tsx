import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const Timer: React.FC = () => {
  const { gameState, serverOffset } = useGame();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!gameState?.endsAt) return;

    const tick = () => {
      const nowSynced = Date.now() + serverOffset;
      const diff = Math.max(0, Math.ceil((gameState.endsAt - nowSynced) / 1000));
      setDisplay(diff);
    };

    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [gameState?.endsAt, serverOffset]);

  if (!gameState || gameState.phase === 'LOBBY') return null;

  return (
    <div className={`timer ${display <= 5 ? 'urgent' : ''}`} aria-live="polite">
      <span className="timer-icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="timer-value">{display}s</span>
    </div>
  );
};