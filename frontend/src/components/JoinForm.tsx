import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SKETCHES } from '../../../shared/sketches';
import { GameConfig } from '../../../shared';
import { Box, Container, Paper, Typography, TextField, Slider, Button, Stack, Divider } from '@mui/material';

export const JoinForm: React.FC = () => {
  const { createRoom, identify } = useGame();

  // User & Navigation State
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [roomCode, setRoomCode] = useState('');
  const [isVetting, setIsVetting] = useState(false);

  // Game Settings (Defaults)
  const [numRounds, setNumRounds] = useState<number>(5);
  const [roundLength, setRoundLength] = useState<number>(30);
  const [roundEndLength, setRoundEndLength] = useState<number>(10);
  const [clipLength, setClipLength] = useState<number>(5);

  /**
   * Helper: Checks if a YouTube video is likely available.
   * YouTube returns a 120px wide placeholder image for blocked/dead IDs.
   */
  const checkVideoAvailability = (videoId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      img.onload = () => {
        // If width is 120, it's the 'Video Unavailable' placeholder
        if (img.width === 120) resolve(false);
        else resolve(true);
      };
      img.onerror = () => resolve(false);
    });
  };

  /**
   * CREATE ROOM logic with Video Vetting
   */
  const handleCreate = async () => {
    if (!name) return alert("Enter a name first!");
    setIsVetting(true);
    localStorage.setItem('kp_username', name);

    // 1. Shuffle all available sketches
    const pool = [...SKETCHES].sort(() => 0.5 - Math.random());
    const verifiedSketches = [];

    // 2. Loop through pool until we find enough valid videos
    for (const sketch of pool) {
      if (verifiedSketches.length >= numRounds) break;
      
      const isAvailable = await checkVideoAvailability(sketch.youtubeId);
      if (isAvailable) {
        verifiedSketches.push(sketch);
      }
    }

    // 3. Check if we met the requirement
    if (verifiedSketches.length < numRounds) {
      alert(`Only found ${verifiedSketches.length} playable videos. Try a lower round count.`);
      setIsVetting(false);
      return;
    }

    // 4. Construct final config and send to server
    const config: GameConfig = {
      numRounds,
      clipLength,
      roundLength,
      roundEndLength,
      sketches: verifiedSketches
    };

    await createRoom(name, config);
    setIsVetting(false);
  };

  /**
   * JOIN ROOM logic
   */
  const handleJoin = () => {
    if (!name || !roomCode) return alert("Missing name or code!");
    localStorage.setItem('kp_username', name);
    identify(name, roomCode.toUpperCase());
  };
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', borderRadius: 3 }} elevation={8}>
        <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>Key & Peele Mystery</Typography>

        <Stack spacing={2}>
          <TextField label="Your Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isVetting} fullWidth />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Create a Game</Typography>

            <Typography variant="caption">Rounds: {numRounds}</Typography>
            <Slider min={1} max={15} value={numRounds} onChange={(_, v) => setNumRounds(Number(v))} sx={{ mb: 1 }} />

            <Typography variant="caption">Guess Time: {roundLength}s</Typography>
            <Slider min={10} max={60} step={5} value={roundLength} onChange={(_, v) => setRoundLength(Number(v))} sx={{ mb: 1 }} />

            <Typography variant="caption">Reveal Time: {roundEndLength}s</Typography>
            <Slider min={5} max={30} step={5} value={roundEndLength} onChange={(_, v) => setRoundEndLength(Number(v))} sx={{ mb: 1 }} />

            <Typography variant="caption">Loop Length: {clipLength}s</Typography>
            <Slider min={2} max={10} value={clipLength} onChange={(_, v) => setClipLength(Number(v))} sx={{ mb: 1 }} />

            <Button variant="contained" color="primary" fullWidth onClick={handleCreate} disabled={isVetting || !name} sx={{ mt: 1 }}>
              {isVetting ? 'Vetting Sketches...' : 'Create New Room'}
            </Button>
          </Box>

          <Divider>OR</Divider>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Join a Game</Typography>
            <Stack direction="row" spacing={1}>
              <TextField placeholder="Room Code" inputProps={{ maxLength: 4 }} value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} disabled={isVetting} />
              <Button variant="outlined" onClick={handleJoin} disabled={isVetting || !name || !roomCode}>Join</Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};