import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Typography, 
  Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGame } from '../context/GameContext';
import { GameConfig } from '../../../shared';

export const JoinForm: React.FC = () => {
  const { 
    createRoom, 
    identify, 
    quickPlay, 
    isSearching, 
    quickPlayError, 
    setQuickPlayError 
  } = useGame();
  
  const [name, setName] = useState(localStorage.getItem('kp_username') || '');
  const [roomCode, setRoomCode] = useState('');
  const [numRounds, setNumRounds] = useState(5);
  const [roundLength, setRoundLength] = useState(30);
  const [roundEndLength, setRoundEndLength] = useState(10);
  const [clipLength, setClipLength] = useState(5);
  const [randomStartTime, setRandomStartTime] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = async (cfg?: Partial<GameConfig>) => {
    if (!name) return alert("Enter a name first!");
    localStorage.setItem('kp_username', name);

    const baseConfig = cfg || { numRounds, clipLength, roundLength, roundEndLength, randomStartTime };
    const config = { ...baseConfig, isPublic };

    setShowHostModal(false);
    setQuickPlayError(null);
    await createRoom(name, config);
  };

  const onQuickPlay = () => {
    if (!name.trim()) return alert("Enter a name first!");
    quickPlay(name);
  };

  const handleTryAgain = () => {
    setQuickPlayError(null); // Clear the error modal
    onQuickPlay(); // Trigger search again
  };

  const handleJoin = () => {
    if (!name || !roomCode) return alert("Missing name or code!");
    localStorage.setItem('kp_username', name);
    identify(name, roomCode.toUpperCase());
  };

  return (
    <div className="join-container">
      <h1>Key & Peele<br />Guessing Game</h1>

      <div className="card join-card">
        {/* --- MUI QUICK PLAY ERROR MODAL --- */}
        <Dialog 
          open={!!quickPlayError} 
          onClose={() => setQuickPlayError(null)}
          PaperProps={{
            sx: { 
              backgroundColor: 'rgba(30, 30, 30, 0.95)', 
              color: 'white',
              border: '2px dashed #ff4444',
              borderRadius: '12px',
              minWidth: '300px'
            }
          }}
        >
          <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Permanent Marker, cursive', color: '#ffcccc' }}>
              No Rooms Found
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setQuickPlayError(null)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontFamily: 'Gochi Hand, cursive', fontSize: '1.2rem' }}>
              {quickPlayError}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
            <button className="btn-host" onClick={() => { setQuickPlayError(null); setShowHostModal(true); }}>
              Host Instead
            </button>
            <button className="btn-join" onClick={handleTryAgain}>
              Try Again
            </button>
          </DialogActions>
        </Dialog>

        <section className="input-group">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="e.g. A-A-Ron"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSearching}
          />
        </section>

        <div style={{marginTop:12, display:'flex', gap:12}}>
          <button 
            className={isSearching ? 'btn-host btn-loading' : 'btn-host'} 
            onClick={onQuickPlay} 
            style={{flex:1}} 
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="loading-content"><span className="spinner">⌛</span> FINDING ROOM...</span>
            ) : (
              'QUICK PLAY'
            )}
          </button>
          <button className="btn-host" onClick={() => setShowHostModal(true)} style={{width:160}} disabled={isSearching}>Host Game</button>
        </div>

        <div style={{marginTop:12, display:'flex', gap:12}}>
          <div className="input-group" style={{flex:1}}>
            <input
              type="text"
              placeholder="Room Code"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              disabled={isSearching}
              style={{width:'100%', textAlign:'center'}}
            />
          </div>
          <div style={{width:160}}>
            <button className="btn-join" onClick={handleJoin} style={{width:'100%'}} disabled={isSearching}>Join</button>
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

              <div className="setting-item">
                <label>
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                  {' '}Public Room
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-host" onClick={() => setShowHostModal(false)}>Cancel</button>
              <button className="btn-join" onClick={() => handleCreate()}>Create & Host</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};