import React from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions, getSocket } from "../hooks/useSocket";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";

export default function RoundEndScreen() {
  const game = useGameState();
  const actions = useSocketActions();
  const player = useYouTubePlayer(game.video);

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  return (
    <div style={{ padding: 20 }}>
      <h2>Round End</h2>

      {game.video && (
        <>
          <iframe
            ref={player.iframeRef}
            width="420"
            height="315"
            src={`${game.video.url}?start=${game.video.startTime}&end=${game.video.endTime}&autoplay=1&controls=1&enablejsapi=1`}
            allow="autoplay"
            frameBorder="0"
            title="YouTube video player"
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={player.toggleMute}>
              {player.isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </button>
            <button onClick={player.decreaseVolume}>-</button>
            <input
              type="range"
              min={0}
              max={100}
              value={player.isMuted ? 0 : player.volume}
              onChange={(e) => player.changeVolume(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <button onClick={player.increaseVolume}>+</button>
            <span style={{ marginLeft: 8 }}>
              Volume: {player.isMuted ? 0 : player.volume}
            </span>
          </div>
        </>
      )}

      <h3>Scores:</h3>
      <ul>
        {Object.entries(game.scores).map(([id, p]) => (
          <li key={id}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>

      {isHost && (
        <button onClick={() => actions.nextRound(game.roomId)}>Next Round</button>
      )}
    </div>
  );
}
