import React from 'react';
import { useGame } from '../context/GameContext';
import { Box, Container, Paper, Typography, Avatar, Stack, Button, Divider, Grid } from '@mui/material';

export const Lobby: React.FC = () => {
  const { gameState, socket, clientId, roomCode, leaveGame } = useGame();

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const isHost = gameState.hostId === clientId;

  const handleStart = () => {
    socket?.emit('start_game', { roomCode, clientId });
  };

  return (
    <Container sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper sx={{ p: 3, width: '100%', borderRadius: 3 }} elevation={8}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5">Room Code: <span style={{ color: '#ffb74d' }}>{roomCode}</span></Typography>
            <Typography variant="body2" color="text.secondary">Waiting for players to join...</Typography>
          </Box>

          <Button variant="outlined" color="secondary" onClick={leaveGame}>Quit Room</Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {players.map(p => (
            <Grid item xs={12} sm={6} md={4} key={p.clientId}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar>{p.name?.charAt(0) || 'P'}</Avatar>
                <Stack>
                  <Typography sx={{ fontWeight: p.clientId === clientId ? 700 : 600 }}>{p.name} {p.clientId === gameState.hostId && '👑'}</Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3 }}>
          {isHost ? (
            <Button variant="contained" color="primary" onClick={handleStart} disabled={players.length < 1} fullWidth>
              START GAME ({players.length} Players)
            </Button>
          ) : (
            <Typography color="text.secondary">The host will start the game soon...</Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};