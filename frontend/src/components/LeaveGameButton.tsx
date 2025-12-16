import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../context/GameContext';
import { getSocket } from '../hooks/useSocket';

interface LeaveGameButtonProps {
  variant?: 'button' | 'icon';
}

export default function LeaveGameButton({ variant = 'icon' }: LeaveGameButtonProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const game = useGameState();

  const handleLeave = () => {
    const socket = getSocket();
    if (game.gameId) {
      socket.emit('leave_game', { gameId: game.gameId });
    }
    game.clearGameData();
    setOpen(false);
    navigate('/');
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Leave Game">
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1000,
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
          >
            <ExitToAppIcon />
          </IconButton>
        </Tooltip>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Leave Game?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to leave? You won't be able to rejoin this game.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleLeave} color="error" variant="contained">
              Leave
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<ExitToAppIcon />}
        onClick={() => setOpen(true)}
      >
        Leave Game
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Leave Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave? You won't be able to rejoin this game.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleLeave} color="error" variant="contained">
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

