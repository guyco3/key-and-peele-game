import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';

export const GuessFeed: React.FC<{ fullHeight?: boolean }> = ({ fullHeight = false }) => {
  const { gameState } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.guessFeed.length]);

  if (!gameState) return null;

  return (
    <Box sx={{ overflow: 'auto', height: fullHeight ? '100%' : 240 }} ref={scrollRef}>
      <List>
        {gameState.guessFeed.length === 0 && (
          <Typography variant="body2" color="text.secondary">No guesses yet...</Typography>
        )}

        {gameState.guessFeed.map((guess, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={<strong style={{ color: guess.isCorrect ? '#4caf50' : 'inherit' }}>{guess.playerName}{guess.isCorrect ? ' guessed correctly! 🎉' : ''}</strong>}
              secondary={!guess.isCorrect ? guess.text : null}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};