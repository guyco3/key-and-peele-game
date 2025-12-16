import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { TimerState } from '../../../shared';

interface CountdownTimerProps {
  timerState: TimerState | null;
}

export default function CountdownTimer({ timerState }: CountdownTimerProps) {
  // Always render the structure to prevent unmounting/remounting
  if (!timerState || timerState.type === null || !timerState.remainingTime) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minHeight: 200,
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  const remaining = timerState.remainingTime ?? 0;
  const duration = timerState.duration || 1;
  const progress = Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100));

  const getColor = () => {
    if (timerState.type === 'round') {
      return 'primary';
    }
    return 'secondary';
  };

  const getLabel = () => {
    if (timerState.type === 'round') {
      return 'Round Time';
    }
    return 'Next Round';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        {getLabel()}
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={120}
          thickness={4}
          color={getColor()}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" component="div" fontWeight={700}>
            {remaining}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

