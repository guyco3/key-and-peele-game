import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface LeaderboardProps {
  isModal?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isModal, open, onClose }) => {
  const { gameState, clientId } = useGame();
  const [collapsed, setCollapsed] = useState(false);

  if (!gameState) return null;

  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);

  const content = (
    <div className={`player-list ${isModal ? 'modal-list' : ''}`}>
      {sortedPlayers.map((p, idx) => (
        <div key={p.clientId} className={`leaderboard-row ${p.clientId === clientId ? 'me' : ''} ${p.hasGuessed ? 'locked-in' : ''}`}>
          <span className="rank">#{idx + 1}</span>
          <span className="name">{p.name}</span>
          <span className="score">{p.score}</span>
          <span className="status">
            {!p.hasGuessed && <span title="Hasn't guessed yet">⏳</span>}
            {p.hasGuessed && p.lastGuessCorrect && <span title="Correct">✅</span>}
            {p.hasGuessed && !p.lastGuessCorrect && <span title="Incorrect">❌</span>}
          </span>
        </div>
      ))}
    </div>
  );

  if (isModal) {
    return (
      <Dialog 
        open={!!open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{
          sx: { backgroundColor: '#1a1a1a', color: 'white' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Permanent Marker' }}>Leaderboard</Typography>
          </div>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={`leaderboard ${collapsed ? 'collapsed' : ''}`}>
      <div className="leaderboard-header">
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <h3>Leaderboard</h3>
        </div>
        <button className="leaderboard-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▸' : '▾'}
        </button>
      </div>
      {content}
    </div>
  );
};