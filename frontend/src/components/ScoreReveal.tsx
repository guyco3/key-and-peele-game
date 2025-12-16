import React, { useEffect, useState } from 'react';
import { Box, Typography, Grow } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface ScoreRevealProps {
  wasCorrect: boolean;
  pointsEarned: number;
  previousScore: number;
}

export default function ScoreReveal({ wasCorrect, pointsEarned, previousScore }: ScoreRevealProps) {
  const [displayScore, setDisplayScore] = useState(previousScore);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    
    // Animate score counting up
    if (wasCorrect && pointsEarned > 0) {
      const duration = 1500; // 1.5 seconds
      const steps = 30;
      const increment = pointsEarned / steps;
      const interval = duration / steps;

      let current = previousScore;
      const timer = setInterval(() => {
        current += increment;
        if (current >= previousScore + pointsEarned) {
          setDisplayScore(previousScore + pointsEarned);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.round(current));
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [wasCorrect, pointsEarned, previousScore]);

  return (
    <Grow in={show} timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 3,
          bgcolor: wasCorrect ? 'success.light' : 'error.light',
          borderRadius: 4,
          color: 'white',
        }}
      >
        {wasCorrect ? (
          <CheckCircleIcon sx={{ fontSize: 80 }} />
        ) : (
          <CancelIcon sx={{ fontSize: 80 }} />
        )}
        
        <Typography variant="h4" fontWeight={700}>
          {wasCorrect ? 'Correct!' : 'Incorrect'}
        </Typography>
        
        {wasCorrect && pointsEarned > 0 && (
          <Box textAlign="center">
            <Typography variant="h6">
              +{pointsEarned} points
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {displayScore}
            </Typography>
          </Box>
        )}
        
        {!wasCorrect && (
          <Typography variant="h6">
            Better luck next round!
          </Typography>
        )}
      </Box>
    </Grow>
  );
}

