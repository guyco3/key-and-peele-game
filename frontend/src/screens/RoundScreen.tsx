import React, { useEffect, useRef, useState } from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import PlayerList from "../components/PlayerList";
import AudioPlayer from "../components/AudioPlayer";
import PlaybackControls from "../components/PlaybackControls";
import SketchAutocomplete from "../components/SketchAutocomplete";

const guessingDurationSeconds = 30;
const revealDelaySeconds = 3;

export default function RoundScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const player = useYouTubePlayer(game.video);
  const endRoundSentRef = useRef(false);

  const [guess, setGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(guessingDurationSeconds);
  const [isGuessingActive, setIsGuessingActive] = useState(true);
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  // Reset state when a new round starts
  useEffect(() => {
    setGuessFeedback(null);
    setGuess("");
    setTimeLeft(guessingDurationSeconds);
    setIsGuessingActive(true);
    setRevealCountdown(null);
    endRoundSentRef.current = false;
  }, [game.round]);

  // Guessing timer
  useEffect(() => {
    if (!isGuessingActive || game.status !== "round") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGuessingActive(false);
          setRevealCountdown(revealDelaySeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGuessingActive, game.status]);

  // Short delay before moving to reveal (host triggers endRound)
  useEffect(() => {
    if (revealCountdown === null || game.status !== "round") return;

    if (revealCountdown <= 0) {
      if (isHost && !endRoundSentRef.current) {
        endRoundSentRef.current = true;
        actions.endRound(game.roomId);
      }
      return;
    }

    const interval = setInterval(() => {
      setRevealCountdown((prev) => (prev ?? 1) - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [revealCountdown, game.status, isHost, actions, game.roomId]);

  const handleSubmitGuess = () => {
    if (!guess.trim() || !isGuessingActive) return;

    actions.submitGuess(game.roomId, guess);
    setGuessFeedback(guess);
    setGuess("");
    // Don't clear feedback - it stays until round ends
  };

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Room {game.roomId}</span>
                <strong>
                  Round {game.round} / {game.numRounds}
                </strong>
              </div>
            </div>
            <h1>Guess the sketch</h1>
            <p>Listen to the clip, type the Key & Peele sketch name, and lock it in.</p>
            <div className="chip-row" style={{ marginTop: 10 }}>
              <span className="pill pill--accent">Audio live</span>
              <span className="pill">{Object.keys(game.players).length} players</span>
              <span className="pill">{isGuessingActive ? "Guessing open" : "Guessing closed"}</span>
            </div>
          </div>
          <div className="stack" style={{ alignItems: "flex-end" }}>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => actions.endRound(game.roomId)}>
                End round for everyone
              </button>
            ) : (
              <span className="pill">Waiting for host</span>
            )}
          </div>
        </div>

        <div className="timer">
          <div
            className="timer__bar"
            style={{
              width: `${Math.max(0, (timeLeft / guessingDurationSeconds) * 100)}%`,
            }}
          />
        </div>

        <div className="grid two">
          <div className="card card--bright">
            <div className="card-header">
              <div className="stack">
                <div className="eyebrow">Round timer</div>
                <h3>{isGuessingActive ? "Time to guess" : "Reveal incoming"}</h3>
              </div>
              <div className="pill pill--accent">
                {isGuessingActive ? `${timeLeft}s left` : `Reveal in ${revealCountdown ?? 0}s`}
              </div>
            </div>
            <div className="card-header">
              <div>
                <div className="eyebrow">Now playing</div>
                <h3>Listen in</h3>
              </div>
              <span className="pill">{player.currentTime.toFixed(1)}s</span>
            </div>
            {game.video && (
              <>
                <AudioPlayer video={game.video} iframeRef={player.iframeRef} />
                <div className="panel">
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
              </>
            )}
          </div>

          <div className="grid">
            <PlayerList players={game.players} hostId={game.hostId} currentId={game.clientId} />

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="eyebrow">Your move</div>
                  <h3>Drop your guess</h3>
                </div>
                <span className="pill">Exact sketch title</span>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                <SketchAutocomplete value={guess} onChange={setGuess} onSelect={setGuess} />
                <div className="button-row">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitGuess}
                    disabled={!guess.trim() || !isGuessingActive}
                  >
                    Submit guess
                  </button>
                  <span className="muted">
                    {isGuessingActive ? "Autocomplete is your friend." : "Guessing is closed."}
                  </span>
                </div>
                {guessFeedback && (
                  <div className="guess-badge">
                    <span>Submitted guess:</span> <strong>{guessFeedback}</strong>
                  </div>
                )}
                {!isGuessingActive && (
                  <div className="pill">Guessing closed — waiting for reveal…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
