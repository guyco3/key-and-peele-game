import React from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";
import { getSocket } from "../hooks/useSocket";

export default function LobbyScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  // Check if current user is host by comparing clientIds
  const isHost = game.clientId === game.hostId;

  return (
    <div style={{ padding: 20 }}>
      <h2>Lobby (Room: {game.roomId})</h2>
      
      <h3>Players:</h3>
      <ul>
        {Object.values(game.players).map((p) => (
          <li key={p.name}>{p.name}</li>
        ))}
      </ul>

      {isHost ? (
        <button onClick={() => actions.startGame(game.roomId)} style={{ padding: "8px 16px" }}>
          Start Game
        </button>
      ) : (
        <p style={{ fontStyle: "italic", color: "#666" }}>
          Waiting for host to start...
        </p>
      )}
    </div>
  );
}
