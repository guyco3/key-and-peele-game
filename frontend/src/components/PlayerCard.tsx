import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { Player } from '../../../shared';

interface PlayerCardProps {
  player: Player;
  isHost?: boolean;
  rank?: number;
  showScore?: boolean;
}

export default function PlayerCard({ player, isHost, rank, showScore = false }: PlayerCardProps) {
  const getRankColor = () => {
    if (rank === 1) return 'success';
    if (rank === 2) return 'info';
    if (rank === 3) return 'warning';
    return 'default';
  };

  return (
    <Card
      sx={{
        minWidth: 200,
        bgcolor: isHost ? 'primary.light' : 'background.paper',
        color: isHost ? 'primary.contrastText' : 'text.primary',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <PersonIcon />
          <Typography variant="h6" component="div" noWrap>
            {player.name}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {showScore && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <EmojiEventsIcon fontSize="small" />
              <Typography variant="h6" fontWeight={700}>
                {player.score}
              </Typography>
            </Box>
          )}
          
          {isHost && (
            <Chip
              label="Host"
              size="small"
              sx={{
                bgcolor: isHost ? 'rgba(255,255,255,0.3)' : 'primary.main',
                color: 'white',
              }}
            />
          )}
          
          {rank && rank <= 3 && (
            <Chip
              label={`#${rank}`}
              size="small"
              color={getRankColor() as any}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

