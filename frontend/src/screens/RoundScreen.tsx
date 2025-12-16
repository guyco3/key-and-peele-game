import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Grid,
  Chip,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import AudioPlayer from "../components/AudioPlayer";
import PlaybackControls from "../components/PlaybackControls";
import SketchAutocomplete from "../components/SketchAutocomplete";
import LeaveGameButton from "../components/LeaveGameButton";
import CountdownTimer from "../components/CountdownTimer";
import WelcomeBackSnackbar from "../components/WelcomeBackSnackbar";
import HostDisconnectedModal from "../components/HostDisconnectedModal";
import PersonIcon from '@mui/icons-material/Person';

export default function RoundScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const player = useYouTubePlayer(game.video);
  
  const [guess, setGuess] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if current user is host
  const isHost = game.clientId === game.hostId;

  // Clear submission state when round changes
  useEffect(() => {
    setHasSubmitted(false);
    setGuess("");
  }, [game.round]);

  const handleSubmitGuess = () => {
    if (!guess.trim()) return;
    
    actions.submitGuess(game.gameId, guess);
    setHasSubmitted(true);
    // Keep the guess visible but mark as submitted
  };

  const handleSkip = () => {
    actions.skipTimer(game.gameId);
  };

  return (
    <>
      <LeaveGameButton variant="icon" />
      <WelcomeBackSnackbar open={game.isReconnecting} onClose={() => game.setIsReconnecting(false)} />
      <HostDisconnectedModal open={game.hostDisconnected} />

      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h3" fontWeight={700} color="primary">
              Round {game.round}
            </Typography>
            <Chip
              label={`${Object.keys(game.players).length} Players`}
              icon={<PersonIcon />}
              color="primary"
              size="large"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Left Column - Audio Player & Timer */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Timer - Only show if auto-progression is enabled */}
                {game.gameRules?.autoProgress && (
                  <Card sx={{ p: 3, textAlign: 'center' }}>
                    <CountdownTimer 
                      timerState={game.timerState?.type === 'round' ? game.timerState : null} 
                    />
                  </Card>
                )}

                {/* Audio Player */}
                {game.video && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Listen to the Clip
                    </Typography>
                    <AudioPlayer video={game.video} iframeRef={player.iframeRef} />
                    <Box mt={2}>
                      <PlaybackControls
                        video={game.video}
                        isPlaying={player.isPlaying}
                        currentTime={player.currentTime}
                        volume={player.volume}
                        isMuted={player.isMuted}
                        onTogglePlayPause={player.togglePlayPause}
                        onRestart={player.restart}
                        onSeek={player.seek}
                        onToggleMute={player.toggleMute}
                        onVolumeChange={player.changeVolume}
                        onIncreaseVolume={player.increaseVolume}
                        onDecreaseVolume={player.decreaseVolume}
                      />
                    </Box>
                  </Card>
                )}

                {/* Host Controls */}
                {isHost && (
                  <Card sx={{ p: 2, bgcolor: 'primary.light' }}>
                    <Typography variant="subtitle2" color="white" gutterBottom>
                      Host Controls
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSkip}
                      startIcon={<SkipNextIcon />}
                      sx={{ bgcolor: 'white', color: 'primary.main' }}
                    >
                      Skip to Results
                    </Button>
                  </Card>
                )}
              </Stack>
            </Grid>

            {/* Right Column - Guess Input & Players */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Guess Input */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Your Guess
                  </Typography>

                  {hasSubmitted ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Guess submitted: "{guess}"
                      <br />
                      <Typography variant="caption">
                        You can change your answer before the round ends
                      </Typography>
                    </Alert>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Only your most recent guess counts
                    </Typography>
                  )}

                  <Stack spacing={2}>
                    <SketchAutocomplete
                      value={hasSubmitted ? guess : guess}
                      onChange={setGuess}
                      onSelect={setGuess}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleSubmitGuess}
                      disabled={!guess.trim()}
                      endIcon={<SendIcon />}
                      sx={{ py: 2 }}
                    >
                      {hasSubmitted ? 'Update Guess' : 'Submit Guess'}
                    </Button>
                  </Stack>
                </Card>

                {/* Players List (NO SCORES SHOWN) */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Players in Game
                  </Typography>
                  <Stack spacing={1}>
                    {Object.values(game.players).map((p) => (
                      <Paper
                        key={p.clientId}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: p.clientId === game.hostId ? 'primary.light' : 'grey.100',
                          color: p.clientId === game.hostId ? 'white' : 'text.primary',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon />
                          <Typography fontWeight={600}>{p.name}</Typography>
                        </Box>
                        {p.clientId === game.hostId && (
                          <Chip
                            label="Host"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.3)',
                              color: 'white',
                            }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
