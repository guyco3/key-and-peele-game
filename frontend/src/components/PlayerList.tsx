import React from "react";
import { Player } from "../context/GameContext";

interface PlayerListProps {
  players: Record<string, Player>;
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div>
      <h3 style={{ margin: "0 0 10px 0" }}>Players:</h3>
      <ul style={{ margin: "0 0 10px 0" }}>
        {Object.entries(players).map(([id, p]) => (
          <li key={id}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>
    </div>
  );
}
