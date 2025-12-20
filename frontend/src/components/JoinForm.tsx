import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SKETCHES } from '../../../shared/sketches';
import { GameConfig } from '../../../shared';

export const JoinForm: React.FC = () => {
  const { createRoom, identify } = useGame();
  
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleHost = async () => {
    if (!name.trim()) return alert("Enter your name first!");
    localStorage.setItem('kp_username', name);

    const config: GameConfig = {
      numRounds: 5,
      clipLength: 5,
      roundLength: 30,
      roundEndLength: 10,
      sketches: [...SKETCHES].sort(() => 0.5 - Math.random()).slice(0, 5)
    };

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
    <div className="welcome-container">
      {/* Chalk doodles scattered around the board */}
      <div className="chalk-doodles">
        {/* Top row */}
        <span className="chalk-text substitute-teacher">Substitute Teacher</span>
        <span className="chalk-text valets">Valets</span>
        <span className="chalk-text liam-neesons">Liam Neesons</span>
        <span className="chalk-text text-message-confusion">Text Message Confusion</span>
        <span className="chalk-text obama">Obama</span>
        <span className="chalk-text luther">Luther</span>
        <span className="chalk-text anger-translator">Anger Translator</span>
        <span className="chalk-text dubstep">Dubstep</span>
        <span className="chalk-text phone-call">Phone Call</span>
        <span className="chalk-text three-pumps">3 Pumps</span>
        <span className="chalk-text gay-wedding-advice">Gay Wedding Advice</span>
        <span className="chalk-text east-west-bowl">East/West Bowl</span>
        <span className="chalk-text rap-album">Rap Album</span>
        <span className="chalk-text negrotown">Negrotown</span>
        <span className="chalk-text car-keys">Car Keys</span>
        
        {/* Upper middle */}
        <span className="chalk-text i-said-biiiitch">I Said Biiiitch</span>
        <span className="chalk-text continental-breakfast">Continental Breakfast</span>
        <span className="chalk-text prepared-for-terries">Prepared For Terries</span>
        <span className="chalk-text get-out">Get Out</span>
        
        {/* Left side */}
        <span className="chalk-text mr-garvey">Mr. Garvey</span>
        <span className="chalk-text pre-sent">Pre-Sent</span>
        <span className="chalk-text balakay">Balakay</span>
        <span className="chalk-text clar-eese">Clar-Eese</span>
        <span className="chalk-text insubordinate">Insubordinate!</span>
        <span className="chalk-text d-nice">D-Nice</span>
        <span className="chalk-text meegan">Meegan</span>
        <span className="chalk-text wendell">Wendell</span>
        <span className="chalk-text pegasus">Pegasus</span>
        <span className="chalk-text pizza-order">Pizza Order</span>
        <span className="chalk-text aerobics">Aerobics</span>
        
        {/* Right side */}
        <span className="chalk-text a-a-ron">A-A-Ron</span>
        <span className="chalk-text tim-o-thee">Tim-O-Thee</span>
        <span className="chalk-text o-shag-hennessy">O-Shag-Hennessy</span>
        <span className="chalk-text ness-a">Ness-A</span>
        <span className="chalk-text jay-quellin">Jay-Quellin</span>
        <span className="chalk-text ya-done">Ya Done</span>
        <span className="chalk-text noice">Noice</span>
        <span className="chalk-text slap-ass">Slap-A$$</span>
        <span className="chalk-text hingle-mccringleberry">Hingle McCringleberry</span>
        <span className="chalk-text fudge">Fudge</span>
        <span className="chalk-text gremlins-2">Gremlins 2</span>
        
        {/* Bottom area */}
        <span className="chalk-text fronthand-backhand">Fronthand Backhand</span>
        <span className="chalk-text awkward-conversation">Awkward Conversation</span>
        <span className="chalk-text office-homophobe">Office Homophobe</span>
      </div>

      <div className="welcome-content">
        <h1 className="welcome-title">KEY & PEELE</h1>
        <p className="welcome-subtitle">GUESSING GAME</p>
        
        <div className="name-input-wrapper">
          <input 
            type="text" 
            className="name-input"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="button-group">
          <button className="btn-host" onClick={handleHost}>
            HOST GAME
          </button>
          <button className="btn-join" onClick={handleJoin}>
            JOIN GAME
          </button>
        </div>
      </div>

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Room Code</h2>
            <input 
              type="text" 
              className="code-input"
              placeholder="ABCD"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <button className="btn-submit" onClick={submitJoin}>
              JOIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
