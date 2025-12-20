import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Lobby: React.FC = () => {
  const { gameState, socket, clientId, roomCode, leaveGame } = useGame();

  // Settings state (for host to adjust before starting)
  const [numRounds, setNumRounds] = useState(5);
  const [roundLength, setRoundLength] = useState(30);
  const [roundEndLength, setRoundEndLength] = useState(10);
  const [clipLength, setClipLength] = useState(5);

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const isHost = gameState.hostId === clientId;

  const handleStart = () => {
    socket?.emit('start_game', { 
      roomCode, 
      clientId,
      config: {
        numRounds,
        roundLength,
        roundEndLength,
        clipLength
      }
    });
  };

  return (
    <div className="lobby-container">
      {/* Chalk doodles */}
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

      {/* Brown frame */}
      <div className="chalkboard-frame"></div>

      <div className="lobby-content">
        <h1 className="lobby-title">KEY & PEELE</h1>
        <h2 className="room-code">Room Code: <span>{roomCode}</span></h2>
        <p className="lobby-subtitle">Waiting for players...</p>

        <div className="player-grid">
          {players.map(p => (
            <div key={p.clientId} className={`player-card ${p.clientId === clientId ? 'is-me' : ''}`}>
              <span className="avatar">👤</span>
              <span className="name">{p.name} {p.clientId === gameState.hostId && "👑"}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <div className="settings-panel">
            <div className="setting-row">
              <span className="setting-label">Rounds</span>
              <div className="setting-buttons">
                {[3, 5, 10, 15].map(n => (
                  <button 
                    key={n}
                    className={`setting-btn ${numRounds === n ? 'active' : ''}`}
                    onClick={() => setNumRounds(n)}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">Guess Time</span>
              <div className="setting-buttons">
                {[15, 30, 45, 60].map(n => (
                  <button 
                    key={n}
                    className={`setting-btn ${roundLength === n ? 'active' : ''}`}
                    onClick={() => setRoundLength(n)}
                  >{n}s</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">Reveal Time</span>
              <div className="setting-buttons">
                {[5, 10, 15, 20].map(n => (
                  <button 
                    key={n}
                    className={`setting-btn ${roundEndLength === n ? 'active' : ''}`}
                    onClick={() => setRoundEndLength(n)}
                  >{n}s</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">Clip Length</span>
              <div className="setting-buttons">
                {[3, 5, 8, 10].map(n => (
                  <button 
                    key={n}
                    className={`setting-btn ${clipLength === n ? 'active' : ''}`}
                    onClick={() => setClipLength(n)}
                  >{n}s</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="lobby-buttons">
          {isHost ? (
            <button className="btn-host lobby-start" onClick={handleStart} disabled={players.length < 1}>
              START GAME
            </button>
          ) : (
            <div className="wait-status">The host will start the game soon...</div>
          )}

          <button className="btn-leave" onClick={leaveGame}>
            QUIT
          </button>
        </div>
      </div>
    </div>
  );
};
