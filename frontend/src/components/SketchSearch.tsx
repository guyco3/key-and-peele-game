import React, { useState, useMemo } from 'react';
import { SKETCHES } from '../../../shared/sketches';
import { useGame } from '../context/GameContext';

export const SketchSearch: React.FC = () => {
  const { socket, clientId, gameState, roomCode } = useGame();
  const [query, setQuery] = useState('');

  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  const filteredSketches = useMemo(() => {
    const search = normalize(query);
    if (!search) {
      return [...SKETCHES].sort((a, b) => a.name.localeCompare(b.name));
    }
    return SKETCHES.filter(s => normalize(s.name).includes(search));
  }, [query]);

  const handleGuess = (name: string) => {
    socket?.emit('submit_guess', { clientId, roomCode, guess: name });
    setQuery('');
  };

  if (gameState?.players[clientId]?.hasGuessed) {
    return (
      <div className="status-locked">
        <span className="icon">🔒</span> Guess Locked In. Waiting for others...
      </div>
    );
  }

  return (
    <div className="search-container">
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Type to search sketches..." 
        autoFocus
      />
      <ul className="suggestions-list">
        {filteredSketches.map(s => (
          <li key={s.id} onClick={() => handleGuess(s.name)} className="sketch-item">
            <div className="sketch-info">
              <strong className="sketch-name">{s.name}</strong>
              <p className="sketch-desc">{s.description}</p>
              <div className="sketch-tags">
                {s.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            </div>
          </li>
        ))}
        {filteredSketches.length === 0 && (
          <li className="no-results">No sketches found matching "{query}"</li>
        )}
      </ul>
    </div>
  );
};