import React, { useState, useEffect } from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions, getSocket } from "../hooks/useSocket";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import PlayerList from "../components/PlayerList";
import AudioPlayer from "../components/AudioPlayer";
import PlaybackControls from "../components/PlaybackControls";
import SketchAutocomplete from "../components/SketchAutocomplete";

export default function RoundScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const player = useYouTubePlayer(game.video);
  
  const [guess, setGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  // Clear feedback when round changes (new round starts)
  useEffect(() => {
    setGuessFeedback(null);
  }, [game.round]);

  const handleSubmitGuess = () => {
    if (!guess.trim()) return;
    
    actions.submitGuess(game.roomId, guess);
    setGuessFeedback(guess);
    setGuess("");
    // Don't clear feedback - it stays until round ends
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Round {game.round}</h2>

      {/* Players and Host Controls */}
      <div
        style={{
          marginBottom: 20,
          padding: 10,
          backgroundColor: "#f5f5f5",
          borderRadius: 4,
        }}
      >
        <PlayerList players={game.players} />
        {isHost && (
          <button onClick={() => actions.endRound(game.roomId)}>
            End Round (Host)
          </button>
        )}
      </div>

      {/* Audio Player and Controls */}
      {game.video && (
        <div>
          <AudioPlayer video={game.video} iframeRef={player.iframeRef} />
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
        </div>
      )}

      {/* Guess Feedback */}
      {guessFeedback && (
        <div style={{ marginTop: 16, color: "green", fontWeight: "bold" }}>
          Submitted guess: {guessFeedback}
        </div>
      )}

      {/* Guess Input */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 16,
        }}
      >
        <SketchAutocomplete
          value={guess}
          onChange={setGuess}
          onSelect={setGuess}
        />
        <button
          onClick={handleSubmitGuess}
          style={{ padding: "8px 16px", fontSize: 14 }}
        >
          Submit Guess
        </button>
      </div>
    </div>
  );
}
