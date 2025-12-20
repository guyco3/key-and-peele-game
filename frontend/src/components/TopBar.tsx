import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Tooltip } from '@mui/material';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PeopleIcon from '@mui/icons-material/People';
import { useGame } from '../context/GameContext';

export const TopBar: React.FC = () => {
  const { roomCode, gameState, leaveGame } = useGame();

  const playerCount = gameState ? Object.keys(gameState.players).length : 0;

  return (
    <AppBar position="sticky" color="transparent" elevation={2} sx={{ backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Toolbar sx={{ gap: 2 }}>
        <WifiTetheringIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main' }}>Key & Peele — Mystery</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {roomCode && (
            <Tooltip title="Room Code">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>{roomCode?.charAt(0) || 'R'}</Avatar>
                <Box>
                  <Typography variant="subtitle2">{roomCode}</Typography>
                  <Typography variant="caption" color="text.secondary">Code</Typography>
                </Box>
              </Box>
            </Tooltip>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">{playerCount}</Typography>
          </Box>

          <Tooltip title="Leave Room">
            <IconButton onClick={leaveGame} size="small">
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
