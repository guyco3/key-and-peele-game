import React, { useState, useMemo } from 'react';
import { SKETCHES } from '../../../shared/sketches';
import { useGame } from '../context/GameContext';

export const SketchSearch: React.FC = () => {
  const { socket, clientId, gameState, roomCode } = useGame();
  const [query, setQuery] = useState('');

  // Helper to strip extra spaces and lower case
  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  const filteredSketches = useMemo(() => {
    const search = normalize(query);
    
    // If no search, show everything (alphabetical)
    if (!search) {
      return [...SKETCHES].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Filter based on normalized names
    return SKETCHES.filter(s => 
      normalize(s.name).includes(search)
    );
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
        placeholder="Type to filter sketches..." 
        autoFocus
      />
      <ul className="suggestions-list">
        {filteredSketches.map(s => (
          <li key={s.id} onClick={() => handleGuess(s.name)}>
            {s.name}
          </li>
        ))}
        {filteredSketches.length === 0 && (
          <li className="no-results">No sketches found matching "{query}"</li>
        )}
      </ul>
    </div>
  );
};