import React from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";

export default function RoundEndScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const player = useYouTubePlayer(game.video);

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  const leaderboard = Object.entries(game.scores).sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Room {game.roomId}</span>
                <strong>Round {game.round} wrap-up</strong>
              </div>
            </div>
            <h1>Answer revealed</h1>
            <p>Replay the clip, check the scores, then jump to a quick leaderboard.</p>
            {game.video && (
              <div className="chip-row" style={{ marginTop: 8 }}>
                <span className="pill pill--accent">Sketch: {game.video.name}</span>
                <span className="pill">Round {game.round} of {game.numRounds}</span>
              </div>
            )}
          </div>
          <div className="stack" style={{ alignItems: "flex-end" }}>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => actions.showLeaderboard(game.roomId)}>
                Show leaderboard
              </button>
            ) : (
              <span className="pill">Host moves to leaderboard</span>
            )}
          </div>
        </div>

        <div className="grid two">
          <div className="card card--bright">
            <div className="card-header">
              <div>
                <div className="eyebrow">Correct clip</div>
                <h3>{game.video?.name || "Audio clip"}</h3>
              </div>
              <span className="pill">Replay to confirm</span>
            </div>
            {game.video && (
              <>
                <iframe
                  ref={player.iframeRef}
                  width="100%"
                  height="260"
                  src={`${game.video.url}?start=${game.video.startTime}&end=${game.video.endTime}&autoplay=1&controls=1&enablejsapi=1`}
                  allow="autoplay"
                  frameBorder="0"
                  title="YouTube video player"
                  style={{ borderRadius: 14 }}
                />
                <div className="controls__row" style={{ marginTop: 10 }}>
                  <button className="btn btn-ghost" onClick={player.toggleMute}>
                    {player.isMuted ? "🔇 Unmute" : "🔊 Mute"}
                  </button>
                  <input
                    className="range"
                    type="range"
                    min={0}
                    max={100}
                    value={player.isMuted ? 0 : player.volume}
                    onChange={(e) => player.changeVolume(Number(e.target.value))}
                  />
                  <span className="pill">Volume {player.isMuted ? 0 : player.volume}</span>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="eyebrow">Scoreboard</div>
                <h3>Round results</h3>
              </div>
              <span className="pill pill--success">Points updated</span>
            </div>
            <ul className="list">
              {leaderboard.map(([id, p], index) => (
                <li key={id} className="player-tile">
                  <div className="player-meta">
                    <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
                    <div className="stack">
                      <strong>{index === 0 ? `🏆 ${p.name}` : p.name}</strong>
                      <span className="muted">Client {p.clientId.slice(0, 6)}</span>
                    </div>
                  </div>
                  <span className="score">{p.score} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
