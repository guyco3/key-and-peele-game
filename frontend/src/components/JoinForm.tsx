import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SKETCHES } from '../../../shared/sketches';
import { GameConfig } from '../../../shared';

export const JoinForm: React.FC = () => {
  const { createRoom, identify } = useGame();
  
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  // Game Settings (Defaults)
  const [numRounds, setNumRounds] = useState(5);
  const [roundLength, setRoundLength] = useState(30);
  const [roundEndLength, setRoundEndLength] = useState(10);
  const [clipLength, setClipLength] = useState(5);
  const [randomStartTime, setRandomStartTime] = useState(false);

  // Modal visibility for host settings
  const [showHostModal, setShowHostModal] = useState(false);

  const handleCreate = async (cfg?: GameConfig) => {
    if (!name) return alert("Enter a name first!");
    localStorage.setItem('kp_username', name);

    const config: GameConfig = cfg || { numRounds, clipLength, roundLength, roundEndLength, randomStartTime };

    setShowHostModal(false);
    await createRoom(name, config);
  };

  const handleJoin = () => {
    if (!name.trim()) return alert("Enter your name first!");
    setShowJoinModal(true);
  };

  const submitJoin = () => {
    if (!roomCode.trim()) return alert("Enter a room code!");
    localStorage.setItem('kp_username', name);
    identify(name, roomCode.toUpperCase());
  };

  return (
    <div className="join-container">
      <h1>The Unoffical Key & Peele Guessing Game </h1>

      <div className="card">
        <section className="input-group">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="e.g. A-A-Ron"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </section>

        <div className="actions-row">
          <button className="btn-primary" onClick={() => setShowHostModal(true)}>Host Game</button>
          <div className="or-sep">OR</div>
          <div className="join-inline">
            <input
              type="text"
              placeholder="Room Code"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <button className="btn-secondary" onClick={handleJoin}>Join</button>
          </div>
        </div>
      </div>

      {/* Host Settings Modal */}
      {showHostModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Host Game Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Rounds: {numRounds}</label>
                <input
                  type="range" min="1" max="20" step="1"
                  value={numRounds} onChange={(e) => setNumRounds(Number(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Guess Time: {roundLength}s</label>
                <input
                  type="range" min="10" max="60" step="5"
                  value={roundLength} onChange={(e) => setRoundLength(Number(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Reveal Time: {roundEndLength}s</label>
                <input
                  type="range" min="5" max="30" step="5"
                  value={roundEndLength} onChange={(e) => setRoundEndLength(Number(e.target.value))}
                />
              </div>
              <div className="setting-item">
                <label>Clip Loop: {clipLength}s</label>
                <input
                  type="range" min="2" max="15" step="1"
                  value={clipLength} onChange={(e) => setClipLength(Number(e.target.value))}
                />
              </div>

              <div className="setting-item">
                <label>
                  <input type="checkbox" checked={randomStartTime} onChange={e => setRandomStartTime(e.target.checked)} />
                  {' '}Random Start Times
                </label>
                <small style={{display:'block',opacity:0.8}}>If enabled, each clip will start at a random second.</small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowHostModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleCreate({ numRounds, roundLength, roundEndLength, clipLength, randomStartTime })}>Create & Host</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
