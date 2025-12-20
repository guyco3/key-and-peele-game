import React from 'react';
import { useGame } from '../context/GameContext';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from '@mui/material';

export const Leaderboard: React.FC = () => {
  const { gameState, clientId } = useGame();

  if (!gameState) return null;

  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);

  return (
    <Box>
      <List dense>
        {sortedPlayers.map((p, idx) => (
          <ListItem key={p.clientId} sx={{ py: 0.5 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: p.clientId === clientId ? 'primary.main' : 'grey.800' }}>{p.name?.charAt(0) || 'P'}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={<Typography sx={{ fontWeight: p.clientId === clientId ? 700 : 600 }}>{p.name}</Typography>}
              secondary={<span style={{ color: '#ffb74d' }}>{p.score} pts • {p.hasGuessed ? '✅' : '⏳'}</span>}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};