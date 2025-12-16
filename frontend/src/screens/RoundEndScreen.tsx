import React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import PlayerCard from "../components/PlayerCard";
import LeaveGameButton from "../components/LeaveGameButton";
import CountdownTimer from "../components/CountdownTimer";
import WelcomeBackSnackbar from "../components/WelcomeBackSnackbar";
import HostDisconnectedModal from "../components/HostDisconnectedModal";
import VideoPlayer from "../components/VideoPlayer";

export default function RoundEndScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  const isHost = game.clientId === game.hostId;

  // Create leaderboard sorted by score
  const leaderboard = Object.entries(game.players)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => b.score - a.score);

  const handleNextRound = () => {
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
          <Paper
            elevation={4}
            sx={{
              p: 4,
              mb: 4,
              textAlign: 'center',
              bgcolor: 'success.light',
              color: 'white',
              borderRadius: 4,
            }}
          >
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Round {game.round} Complete!
            </Typography>
            {game.video && (
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  The correct answer was:
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {game.video.name}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Video Reveal */}
          {game.video && (
            <Card sx={{ p: 3, mb: 4 }}>
              <VideoPlayer video={game.video} autoplay={true} />
            </Card>
          )}

          {/* Timer - Only show if auto-progression is enabled */}
          {game.gameRules?.autoProgress && (
            <Card sx={{ p: 3, mb: 4, textAlign: 'center' }}>
              <CountdownTimer 
                timerState={game.timerState?.type === 'round_end' ? game.timerState : null} 
              />
            </Card>
          )}

          {/* Leaderboard */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <EmojiEventsIcon fontSize="large" color="warning" />
              <Typography variant="h4" fontWeight={600}>
                Leaderboard
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {leaderboard.map((player, index) => (
                <Grid item xs={12} sm={6} md={4} key={player.id}>
                  <PlayerCard
                    player={player}
                    isHost={player.clientId === game.hostId}
                    rank={index + 1}
                    showScore
                  />
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* Host Controls */}
          {isHost && (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: 'primary.light',
                color: 'white',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Host Controls
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleNextRound}
                startIcon={<SkipNextIcon />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 2,
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                Skip to Next Round
              </Button>
            </Paper>
          )}

          {!isHost && (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: 'grey.100',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" color="text.secondary" fontStyle="italic">
                Get ready for the next round...
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </>
  );
}
