import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SKETCHES } from '../../../shared/sketches';
import { GameConfig } from '../../../shared';

export const JoinForm: React.FC = () => {
  const { createRoom, identify } = useGame();
  
  // User Info
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [roomCode, setRoomCode] = useState('');

  // Game Settings (Defaults)
  const [numRounds, setNumRounds] = useState(5);
  const [roundLength, setRoundLength] = useState(30);
  const [roundEndLength, setRoundEndLength] = useState(10);
  const [clipLength, setClipLength] = useState(5);

  const handleCreate = async () => {
    if (!name) return alert("Enter a name first!");
    localStorage.setItem('kp_username', name);

    // Construct config from state
    const config: GameConfig = {
      numRounds,
      clipLength,
      roundLength,
      roundEndLength,
      // Send full catalog; rounds will pick randomly server-side
      sketches: [...SKETCHES]
    };

    await createRoom(name, config);
  };

  const handleJoin = () => {
    if (!name || !roomCode) return alert("Missing name or code!");
    localStorage.setItem('kp_username', name);
    identify(name, roomCode.toUpperCase());
  };

  return (
    <div className="join-container">
      <h1>Key & Peele Mystery</h1>
      
      <div className="card">
        <section className="input-group">
          <label>Your Name</label>
          <input 
            type="text" 
            placeholder="e.g. A-A-Ron" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        <div className="setup-sections">
          {/* CREATE SECTION */}
          <section className="create-section">
            <h3>Create a Game</h3>
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
            </div>
            <button className="btn-primary" onClick={handleCreate}>
              Create New Room
            </button>
          </section>

          <div className="divider"><span>OR</span></div>

          {/* JOIN SECTION */}
          <section className="join-section">
            <h3>Join a Game</h3>
            <div className="join-row">
              <input 
                type="text" 
                placeholder="Room Code" 
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
              <button className="btn-secondary" onClick={handleJoin}>Join</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
