import React from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import PlayerList from "../components/PlayerList";

export default function LobbyScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Room</span>
                <strong>{game.roomId || "Waiting for room..."}</strong>
              </div>
            </div>
            <h1>Lobby</h1>
            <p>Share the room code and get everyone in before the first clip drops.</p>
            <div className="chip-row" style={{ marginTop: 8 }}>
              <span className="pill pill--accent">{Object.keys(game.players).length} players</span>
              <span className="pill">Host keeps the controls</span>
            </div>
          </div>
          <div className="stack" style={{ alignItems: "flex-end" }}>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => actions.startGame(game.roomId)}>
                Start game
              </button>
            ) : (
              <span className="pill">Waiting for host to start…</span>
            )}
            <span className="muted">You are signed in as {game.name || "mystery player"}</span>
          </div>
        </div>

        <PlayerList players={game.players} hostId={game.hostId} currentId={game.clientId} showScores={false} />
      </div>
    </div>
  );
}
