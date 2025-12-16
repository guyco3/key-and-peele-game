import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface WelcomeBackSnackbarProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeBackSnackbar({ open, onClose }: WelcomeBackSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="success" variant="filled" sx={{ width: '100%' }}>
        You're back! Welcome to the game.
      </Alert>
    </Snackbar>
  );
}

