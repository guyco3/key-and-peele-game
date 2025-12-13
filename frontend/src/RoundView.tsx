import React, { useState } from 'react';
import YouTubeSnippet from './YouTubeSnippet';

interface RoundViewProps {
  roundInfo: any;
  onSubmitGuess: (guess: string) => void;
  isHost: boolean;
  onNextSegment: () => void;
}

export default function RoundView({ roundInfo, onSubmitGuess, isHost, onNextSegment }: RoundViewProps) {
  const [guess, setGuess] = useState('');
  if (!roundInfo) return <div>Waiting for round...</div>;
  const { videoId, timestamp, duration, maxWrongGuesses } = roundInfo;
  // TODO: Track guesses left per player
  return (
    <div>
      <h2>Round</h2>
      <YouTubeSnippet videoId={videoId} timestamp={timestamp} duration={duration} />
      <div>
        <input
          type="text"
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Guess the sketch..."
        />
        <button onClick={() => { onSubmitGuess(guess); setGuess(''); }}>Submit</button>
      </div>
      <div>Segment: {duration}s</div>
      <div>Guesses left: ?</div>
      {isHost && <button onClick={onNextSegment}>Next Segment</button>}
    </div>
  );
}
