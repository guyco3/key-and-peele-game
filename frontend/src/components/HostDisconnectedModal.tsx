import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

interface HostDisconnectedModalProps {
  open: boolean;
}

export default function HostDisconnectedModal({ open }: HostDisconnectedModalProps) {
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PersistentProps={{
        sx: { backdropFilter: 'blur(5px)' },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WifiOffIcon color="warning" fontSize="large" />
          <Typography variant="h5" fontWeight={600}>
            Host Disconnected
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={2}>
          <CircularProgress color="warning" size={60} />
          <DialogContentText align="center" sx={{ fontSize: '1.1rem' }}>
            The host has disconnected. The game is paused while we wait for them to return.
          </DialogContentText>
          <DialogContentText align="center" color="text.secondary">
            If the host doesn't return within 2 minutes, the game will end.
          </DialogContentText>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

