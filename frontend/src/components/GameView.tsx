import React from 'react';
import { useGame } from '../context/GameContext';
import { VideoPlayer } from './VideoPlayer';
import { SketchSearch } from './SketchSearch';
import { Timer } from './Timer';
import { Leaderboard } from './Leaderboard';
import { GuessFeed } from './GuessFeed';
import { Podium } from './Podium';
import { Box, Grid, Paper, Typography, Button, Divider, useTheme, useMediaQuery } from '@mui/material';

export const GameView: React.FC = () => {
  const { gameState, leaveGame } = useGame();

  if (!gameState) return null;
  const isGameOver = gameState.phase === 'GAME_OVER';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerHeight = isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)';

  // Desktop: Left = SketchSearch (full height), Center = Video, Right = Standings + GuessFeed
  // Mobile: Video then SketchSearch below; hide GuessFeed
  if (isMobile) {
    return (
      <Box sx={{ p: 2, height: containerHeight, overflow: 'auto' }}>
        {isGameOver ? (
          <Podium />
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Round {gameState.currentRound}</Typography>
              <Timer />
            </Box>

            <Paper elevation={10} sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'black' }}>
              <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                <VideoPlayer />
                {gameState.phase === 'ROUND_REVEAL' && (
                  <Box className="reveal-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                    <Typography variant="h5">{gameState.currentSketch?.name}</Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>{gameState.currentSketch?.description}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {gameState.phase === 'ROUND_PLAYING' && (
              <Box sx={{ mt: 2 }}>
                <SketchSearch fullHeight={false} />
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }

  return (
    <Grid container sx={{ height: containerHeight, overflow: 'hidden' }}>
      <Grid item sx={{ width: 320, flexShrink: 0, pr: 1 }}>
        <Paper elevation={6} square sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1 }}>Search</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <SketchSearch fullHeight />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs sx={{ overflow: 'auto', px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isGameOver ? (
          <Podium />
        ) : (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Round {gameState.currentRound}</Typography>
              <Timer />
            </Box>

            <Paper elevation={10} sx={{ width: '100%', height: '100%', maxWidth: 1100, borderRadius: 3, overflow: 'hidden', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoPlayer />
                {gameState.phase === 'ROUND_REVEAL' && (
                  <Box className="reveal-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                    <Typography variant="h4">{gameState.currentSketch?.name}</Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary', maxWidth: 800 }}>{gameState.currentSketch?.description}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Grid>

      <Grid item sx={{ width: 320, flexShrink: 0, pl: 1, display: { xs: 'none', sm: 'block' } }}>
        <Paper elevation={6} square sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>Standings</Typography>
          <Leaderboard />
          <Divider sx={{ my: 1, borderColor: '#222' }} />
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Activity</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <GuessFeed fullHeight />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};