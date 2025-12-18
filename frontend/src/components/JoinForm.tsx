import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SKETCHES } from '../../../shared/sketches';

export const JoinForm: React.FC = () => {
  const { createRoom, identify } = useGame();
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = async () => {
    if (!name) return alert("Enter a name first!");
    localStorage.setItem('kp_username', name);

    // Initial config for the server
    const config = {
      numRounds: 5,
      clipLength: 5,
      roundLength: 30,
      roundEndLength: 10,
      // Randomly pick 5 sketches from your shared list
      sketches: [...SKETCHES].sort(() => 0.5 - Math.random()).slice(0, 5)
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
        <input 
          type="text" 
          placeholder="Who are you? (e.g. A-A-Ron)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="actions">
          <button onClick={handleCreate}>Create New Room</button>
          <div className="divider"><span>OR</span></div>
          <div className="join-row">
            <input 
              type="text" 
              placeholder="Room Code" 
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <button onClick={handleJoin} className="secondary">Join</button>
          </div>
        </div>
      </div>
    </div>
  );
};