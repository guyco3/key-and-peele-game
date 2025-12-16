import React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  Stack,
  Paper,
  Fade,
} from "@mui/material";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import PlayerCard from "../components/PlayerCard";
import LeaveGameButton from "../components/LeaveGameButton";
import WelcomeBackSnackbar from "../components/WelcomeBackSnackbar";
import HostDisconnectedModal from "../components/HostDisconnectedModal";

export default function LobbyScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;
  const playerCount = Object.keys(game.players).length;

  return (
    <>
      <LeaveGameButton variant="icon" />
      <WelcomeBackSnackbar open={game.isReconnecting} onClose={() => game.setIsReconnecting(false)} />
      <HostDisconnectedModal open={game.hostDisconnected} />

      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* PIN Display */}
          <Fade in timeout={500}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                mb: 4,
                bgcolor: 'primary.main',
                color: 'white',
                textAlign: 'center',
                borderRadius: 4,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Game PIN
              </Typography>
              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  letterSpacing: '0.2em',
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                }}
              >
                {game.pin}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                Share this PIN with your friends to join!
              </Typography>
            </Paper>
          </Fade>

          {/* Players */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" fontWeight={600}>
                Players ({playerCount})
              </Typography>
              <Chip
                label={isHost ? "You are the host" : "Waiting for host"}
                color={isHost ? "primary" : "default"}
                size="medium"
              />
            </Box>

            <Grid container spacing={2}>
              {Object.values(game.players).map((player) => (
                <Grid item xs={12} sm={6} md={4} key={player.clientId}>
                  <PlayerCard
                    player={player}
                    isHost={player.clientId === game.hostId}
                  />
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* Start Button or Waiting Message */}
          {isHost ? (
            <Fade in timeout={800}>
              <Box textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => actions.startGame(game.gameId)}
                  disabled={playerCount < 1}
                  sx={{
                    py: 3,
                    px: 6,
                    fontSize: '1.5rem',
                    borderRadius: 3,
                    boxShadow: 4,
                  }}
                >
                  Start Game
                </Button>
                {playerCount < 2 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Waiting for more players to join...
                  </Typography>
                )}
              </Box>
            </Fade>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.100',
                borderRadius: 3,
              }}
            >
              <Typography variant="h5" color="text.secondary" fontStyle="italic">
                Waiting for host to start the game...
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.3}s`,
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                        '50%': { opacity: 1, transform: 'scale(1.2)' },
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </>
  );
}
