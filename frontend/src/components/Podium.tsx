import React from 'react';
import { useGame } from '../context/GameContext';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';

export const Podium: React.FC = () => {
  const { gameState, leaveGame } = useGame();
  if (!gameState) return null;

  const winners = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Final Results 🏆</Typography>

      <Grid container spacing={2} justifyContent="center" alignItems="flex-end">
        {winners.map((player, index) => (
          <Grid item key={player.clientId} xs={12} sm={4} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: index === 0 ? 'primary.dark' : 'background.paper' }} elevation={6}>
              <Typography variant="h3">{medals[index]}</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{player.name}</Typography>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', mt: 0.5 }}>{player.score.toLocaleString()} pts</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button variant="contained" color="primary" onClick={() => window.location.reload()}>Play Again</Button>
        <Button variant="outlined" onClick={leaveGame}>Back to Menu</Button>
      </Box>
    </Box>
  );
};