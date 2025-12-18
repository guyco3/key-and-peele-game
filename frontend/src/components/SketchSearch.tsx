import React, { useState, useMemo } from 'react';
import { SKETCHES } from '../../../shared/sketches';
import { useGame } from '../context/GameContext';

export const SketchSearch: React.FC = () => {
  const { socket, clientId, gameState, roomCode } = useGame();
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return SKETCHES.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }, [query]);

  const handleGuess = (name: string) => {
    socket?.emit('submit_guess', { clientId, roomCode, guess: name });
    setQuery('');
  };

  if (gameState?.players[clientId]?.hasGuessed) {
    return <div className="status">Guess Locked In. Waiting for others...</div>;
  }

  return (
    <div className="search-container">
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Which sketch is this?" 
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map(s => (
            <li key={s.id} onClick={() => handleGuess(s.name)}>{s.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};