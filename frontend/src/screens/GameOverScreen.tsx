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
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { useGameState } from "../context/GameContext";
import PlayerCard from "../components/PlayerCard";

export default function GameOverScreen() {
  const game = useGameState();
  const navigate = useNavigate();

  // Create leaderboard sorted by score
  const leaderboard = Object.entries(game.players)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => b.score - a.score);

  const winner = leaderboard[0];

  const handlePlayAgain = () => {
    game.clearGameData();
    navigate('/');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Winner Announcement */}
        <Paper
          elevation={8}
          sx={{
            p: 6,
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
            }}
          />
          
          <Box position="relative">
            <EmojiEventsIcon sx={{ fontSize: 100, mb: 2 }} />
            <Typography variant="h2" fontWeight={800} gutterBottom>
              Game Over!
            </Typography>
            {winner && (
              <>
                <Typography variant="h4" gutterBottom sx={{ opacity: 0.9 }}>
                  🎉 {winner.name} Wins! 🎉
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {winner.score} points
                </Typography>
              </>
            )}
          </Box>
        </Paper>

        {/* Final Leaderboard */}
        <Card sx={{ p: 4, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <EmojiEventsIcon fontSize="large" color="warning" />
            <Typography variant="h4" fontWeight={600}>
              Final Leaderboard
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {leaderboard.map((player, index) => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <Box
                  sx={{
                    transform: index === 0 ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease-in-out',
                  }}
                >
                  <PlayerCard
                    player={player}
                    isHost={player.clientId === game.hostId}
                    rank={index + 1}
                    showScore
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Play Again Button */}
        <Stack spacing={2}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handlePlayAgain}
            startIcon={<HomeIcon />}
            sx={{
              py: 3,
              fontSize: '1.2rem',
              borderRadius: 3,
            }}
          >
            Return to Home
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
