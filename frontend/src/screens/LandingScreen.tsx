import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Autocomplete,
  Chip,
  Stack,
} from "@mui/material";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import type { Sketch, GameRules } from "../../../shared";
import sketches from "../../../shared/sketches.json";

export default function LandingScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  // Game configuration state
  const [numRounds, setNumRounds] = useState(3);
  const [autoProgress, setAutoProgress] = useState(true);
  const [roundLength, setRoundLength] = useState(30); // seconds
  const [roundEndLength, setRoundEndLength] = useState(10); // seconds
  const [selectedSketches, setSelectedSketches] = useState<Sketch[]>([]);
  const [joinPin, setJoinPin] = useState("");

  const allSketches = sketches as Sketch[];

  const handleCreateRoom = async () => {
    if (!game.name.trim()) return;

    const rules: GameRules = {
      rounds: numRounds,
      segmentStartTime: 0,
      segmentEndTime: 10,
      autoProgress,
      // If manual mode (autoProgress = false), set timers to game expiry time (15 min = 900s)
      // This simplifies backend logic - timers always run, but are effectively infinite in manual mode
      roundLength: autoProgress ? roundLength : 900,
      roundEndLength: autoProgress ? roundEndLength : 900,
      selectedSketches,
    };

    try {
      await actions.createRoom(game.name, rules);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = () => {
    if (!game.name.trim() || !joinPin.trim()) return;
    actions.joinRoom(joinPin.toUpperCase(), game.name);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        {/* Title */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h1" gutterBottom color="primary" fontWeight={800}>
            Key & Peele Game
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Guess the sketch from audio clips!
          </Typography>
        </Box>

        {/* Name Input - Shared */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Your Name"
              value={game.name}
              onChange={(e) => game.setName(e.target.value)}
              variant="outlined"
              size="large"
              placeholder="Enter your name"
            />
          </CardContent>
        </Card>

        {/* Create Room Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom color="primary" fontWeight={600}>
              Create a Game
            </Typography>

            <Stack spacing={3} mt={3}>
              {/* Number of Rounds */}
              <Box>
                <Typography gutterBottom fontWeight={600}>
                  Number of Rounds: {numRounds}
                </Typography>
                <Slider
                  value={numRounds}
                  onChange={(_, val) => setNumRounds(val as number)}
                  min={1}
                  max={25}
                  marks
                  step={1}
                  valueLabelDisplay="auto"
                  color="primary"
                />
              </Box>

              {/* Auto-Progression Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={autoProgress}
                    onChange={(e) => setAutoProgress(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={600}>Auto-Progression</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rounds automatically advance when time expires
                    </Typography>
                  </Box>
                }
              />

              {autoProgress && (
                <div>
                <Box>
                  <Typography gutterBottom fontWeight={600}>
                    Round Length: {roundLength}s
                  </Typography>
                  <Slider
                    value={roundLength}
                    onChange={(_, val) => setRoundLength(val as number)}
                    min={5}
                    max={60}
                    step={5}
                    marks={[
                      { value: 5, label: '5s' },
                      { value: 30, label: '30s' },
                      { value: 60, label: '60s' },
                    ]}
                    valueLabelDisplay="auto"
                    color="secondary"
                  />
                </Box>

                <Box>
                  <Typography gutterBottom fontWeight={600}>
                    Round End Screen: {roundEndLength}s
                  </Typography>
                  <Slider
                    value={roundEndLength}
                    onChange={(_, val) => setRoundEndLength(val as number)}
                    min={5}
                    max={60}
                    step={5}
                    marks={[
                      { value: 5, label: '5s' },
                      { value: 30, label: '30s' },
                      { value: 60, label: '60s' },
                    ]}
                    valueLabelDisplay="auto"
                    color="secondary"
                  />
                </Box>
              </div>
            )}

              {/* Sketch Selection */}
              <Autocomplete
                multiple
                options={allSketches}
                getOptionLabel={(option) => option.name}
                value={selectedSketches}
                onChange={(_, newValue) => setSelectedSketches(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Specific Sketches (Optional)"
                    placeholder="Leave empty for random selection"
                    helperText="Can select duplicates for more chances to guess"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      color="primary"
                    />
                  ))
                }
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCreateRoom}
                disabled={!game.name.trim()}
                sx={{ py: 2, fontSize: '1.2rem' }}
              >
                Create Game
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Join Room Section */}
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom color="secondary" fontWeight={600}>
              Join a Game
            </Typography>

            <Stack spacing={2} mt={3}>
              <TextField
                fullWidth
                label="Game PIN"
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.toUpperCase())}
                variant="outlined"
                placeholder="Enter 6-character PIN"
                inputProps={{ maxLength: 6, style: { textTransform: 'uppercase' } }}
              />

              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                onClick={handleJoinRoom}
                disabled={!game.name.trim() || !joinPin.trim() || joinPin.length !== 6}
                sx={{ py: 2, fontSize: '1.2rem' }}
              >
                Join Game
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
