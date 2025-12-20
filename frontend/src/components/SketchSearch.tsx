import React, { useState, useMemo } from 'react';
import { SKETCHES } from '../../../shared/sketches';
import { useGame } from '../context/GameContext';
import { TextField, List, ListItemButton, ListItemText, Chip, Box, Typography } from '@mui/material';

export const SketchSearch: React.FC<{ fullHeight?: boolean }> = ({ fullHeight = false }) => {
  const { socket, clientId, gameState, roomCode } = useGame();
  const [query, setQuery] = useState('');

  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  const filteredSketches = useMemo(() => {
    const search = normalize(query);
    if (!search) {
      return [...SKETCHES].sort((a, b) => a.name.localeCompare(b.name));
    }
    return SKETCHES.filter(s => normalize(s.name).includes(search));
  }, [query]);

  const handleGuess = (name: string) => {
    socket?.emit('submit_guess', { clientId, roomCode, guess: name });
    setQuery('');
  };

  if (gameState?.players[clientId]?.hasGuessed) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">🔒 Guess Locked In</Typography>
        <Typography variant="body2" color="text.secondary">Waiting for others...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: fullHeight ? '100%' : 'auto' }}>
      <TextField
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search sketches..."
        autoFocus
        fullWidth
        size="small"
        sx={{ mb: 1, backgroundColor: 'background.paper', borderRadius: 1 }}
      />

      <List sx={{ overflow: 'auto', height: fullHeight ? 'calc(100% - 56px)' : 260 }}>
        {filteredSketches.map(s => (
          <ListItemButton key={s.id} onClick={() => handleGuess(s.name)} sx={{ py: 1.2 }}>
            <ListItemText
              primary={<strong style={{ color: '#ffb86b' }}>{s.name}</strong>}
              secondary={<Typography variant="body2" color="text.secondary">{s.description}</Typography>}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {s.tags.slice(0,3).map(tag => <Chip key={tag} label={`#${tag}`} size="small" />)}
            </Box>
          </ListItemButton>
        ))}

        {filteredSketches.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">No sketches found matching "{query}"</Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};