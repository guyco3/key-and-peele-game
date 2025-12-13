import React from 'react';

interface SegmentResultViewProps {
  segmentResult: any;
  isHost: boolean;
  onNextSegment: () => void;
}

export default function SegmentResultView({ segmentResult, isHost, onNextSegment }: SegmentResultViewProps) {
  if (!segmentResult) return <div>Waiting for result...</div>;
  const { anyoneGuessedCorrectly, winners, correctSketch, nextSegmentDuration, scores } = segmentResult;
  return (
    <div>
      <h2>Segment Result</h2>
      {anyoneGuessedCorrectly ? (
        <div>
          <div>Winner(s): {winners?.join(', ')}</div>
          <div>Correct Sketch: {correctSketch}</div>
        </div>
      ) : (
        <div>No one guessed correctly.</div>
      )}
      <div>
        <h3>Scores</h3>
        <ul>
          {scores && Object.entries(scores).map(([pid, score]: any) => (
            <li key={pid}>{pid}: {score}</li>
          ))}
        </ul>
      </div>
      {isHost && (
        nextSegmentDuration ? (
          <button onClick={onNextSegment}>Next Segment ({nextSegmentDuration}s)</button>
        ) : (
          <button onClick={onNextSegment}>Next Round</button>
        )
      )}
    </div>
  );
}
