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

  return <div className={`timer ${display <= 5 ? 'urgent' : ''}`}>{display}s</div>;
};