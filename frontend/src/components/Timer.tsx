import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Typography, Box } from '@mui/material';

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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Time</Typography>
      <Typography variant="h6" sx={{ color: display <= 5 ? 'error.main' : 'primary.main', fontWeight: 800 }}>{display}s</Typography>
    </Box>
  );
};