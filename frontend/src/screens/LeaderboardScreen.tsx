import React, { useEffect, useRef, useState } from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import PlayerList from "../components/PlayerList";

const leaderboardDurationSeconds = 5;

export default function LeaderboardScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const isHost = game.clientId === game.hostId;
  const [timeLeft, setTimeLeft] = useState(leaderboardDurationSeconds);
  const nextRoundSent = useRef(false);

  useEffect(() => {
    setTimeLeft(leaderboardDurationSeconds);
    nextRoundSent.current = false;
  }, [game.round]);

  useEffect(() => {
    if (game.status !== "leaderboard") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isHost && !nextRoundSent.current) {
            nextRoundSent.current = true;
            actions.nextRound(game.roomId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.status, isHost, actions, game.roomId]);

  const percent = Math.max(0, (timeLeft / leaderboardDurationSeconds) * 100);

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Room {game.roomId}</span>
                <strong>Leaderboard</strong>
              </div>
            </div>
            <h1>Quick standings</h1>
            <p>Next round auto-starts in just a moment.</p>
          </div>
          <div className="stack" style={{ alignItems: "flex-end" }}>
            <span className="pill">Starting next clip shortly…</span>
          </div>
        </div>

        <div className="timer">
          <div className="timer__bar" style={{ width: `${percent}%` }} />
        </div>

        <PlayerList players={game.scores} hostId={game.hostId} currentId={game.clientId} />
      </div>
    </div>
  );
}
