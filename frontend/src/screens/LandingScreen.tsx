import React from "react";
import { useGameState } from "../context/GameContext";
import { useSocketActions } from "../hooks/useSocket";

export default function LandingScreen() {
  const game = useGameState();
  const actions = useSocketActions();

  const handleCreateRoom = () => {
    if (!game.name.trim()) return;
    actions.createRoom(game.name, game.numRounds);
    // Navigation will happen when room_created event is received
  };

  const handleJoinRoom = () => {
    if (!game.name.trim() || !game.roomId.trim()) return;
    actions.joinRoom(game.roomId, game.name);
    // Navigation will happen when room_joined event is received
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Key & Peele Game</h1>
      
      <div style={{ marginBottom: 40 }}>
        <h2>Create Room</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Your Name"
            value={game.name}
            onChange={(e) => game.setName(e.target.value)}
            style={{ padding: "8px", width: "100%", maxWidth: 300 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Number of Rounds:</label>
          <input
            type="number"
            min="1"
            max="25"
            value={game.numRounds}
            onChange={(e) =>
              game.setNumRounds(Math.min(25, Math.max(1, Number(e.target.value))))
            }
            style={{ width: 60, padding: "8px" }}
          />
          <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
            (1-25 rounds)
          </span>
        </div>
        <button
          onClick={handleCreateRoom}
          disabled={!game.name.trim()}
          style={{ padding: "8px 16px" }}
        >
          Create Room
        </button>
      </div>

      <div style={{ paddingTop: 20, borderTop: "1px solid #ccc" }}>
        <h2>Join Room</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Your Name"
            value={game.name}
            onChange={(e) => game.setName(e.target.value)}
            style={{ padding: "8px", width: "100%", maxWidth: 300, marginBottom: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Room ID"
            value={game.roomId}
            onChange={(e) => game.setRoomId(e.target.value)}
            style={{ padding: "8px", width: "100%", maxWidth: 300 }}
          />
        </div>
        <button
          onClick={handleJoinRoom}
          disabled={!game.name.trim() || !game.roomId.trim()}
          style={{ padding: "8px 16px" }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
