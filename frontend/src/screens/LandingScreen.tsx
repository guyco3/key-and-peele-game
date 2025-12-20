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

  const createDisabled = !game.name.trim();
  const joinDisabled = !game.name.trim() || !game.roomId.trim();

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="screen__header">
          <div>
            <div className="brand">
              <div className="brand__icon">KP</div>
              <div className="brand__text">
                <span className="eyebrow">Key & Peele</span>
                <strong>Audio Guessing Party</strong>
              </div>
            </div>
            <h1>Grab friends, guess sketches, brag later.</h1>
            <p>
              Host a room or jump into one. Everyone hears the same Key & Peele audio clip—first
              to guess the sketch name scores.
            </p>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <span className="pill pill--accent">Audio only</span>
              <span className="pill">1-25 rounds</span>
              <span className="pill">Name the sketch title</span>
            </div>
          </div>
        </div>

        <div className="grid two">
          <div className="card card--bright">
            <div className="card-header">
              <div>
                <div className="eyebrow">Host mode</div>
                <h3>Create a room</h3>
              </div>
              <span className="pill">You control the rounds</span>
            </div>
            <div className="field">
              <label>Your name</label>
              <input
                className="input"
                placeholder="Jordan"
                value={game.name}
                onChange={(e) => game.setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Number of rounds</label>
              <div className="controls__row">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="25"
                  value={game.numRounds}
                  onChange={(e) =>
                    game.setNumRounds(Math.min(25, Math.max(1, Number(e.target.value))))
                  }
                  style={{ width: 140 }}
                />
                <span className="pill">Keep it quick or go epic</span>
              </div>
            </div>
            <div className="button-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleCreateRoom} disabled={createDisabled}>
                Create room
              </button>
              <span className="muted">Share the room code that appears next.</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="eyebrow">Join friends</div>
                <h3>Hop into a room</h3>
              </div>
              <span className="pill">Bring your best ear</span>
            </div>
            <div className="field">
              <label>Your name</label>
              <input
                className="input"
                placeholder="Keegan"
                value={game.name}
                onChange={(e) => game.setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Room code</label>
              <input
                className="input"
                placeholder="ABC123"
                value={game.roomId}
                onChange={(e) => game.setRoomId(e.target.value)}
              />
            </div>
            <div className="button-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleJoinRoom} disabled={joinDisabled}>
                Join room
              </button>
              <button className="btn btn-ghost" onClick={() => game.setRoomId("")}>
                Clear code
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div>
              <div className="eyebrow">How it works</div>
              <h3>Stay nimble, guess boldly</h3>
            </div>
            <span className="pill pill--success">Pro tip: shout the exact sketch name</span>
          </div>
          <div className="grid two">
            <div className="stack">
              <strong>1. Listen</strong>
              <p className="muted">Audio plays for everyone. No peeking—just your ears and memory.</p>
            </div>
            <div className="stack">
              <strong>2. Guess fast</strong>
              <p className="muted">Type the sketch title. Autocomplete helps if you blank.</p>
            </div>
            <div className="stack">
              <strong>3. Win the round</strong>
              <p className="muted">Host moves to the next clip. Points stack across rounds.</p>
            </div>
            <div className="stack">
              <strong>4. Crown the champ</strong>
              <p className="muted">Highest score after the final round takes the bragging rights.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
