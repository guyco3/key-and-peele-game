import React, { useState } from 'react';

interface LobbyViewProps {
  onCreateRoom: (name: string, rules: any) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onStartGame: () => void;
  isHost: boolean;
  roomId: string | null;
  playerName: string;
  players: any;
  rules: any;
}

export default function LobbyView({
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  isHost,
  roomId,
  playerName,
  players,
  rules
}: LobbyViewProps) {
  const [name, setName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [rounds, setRounds] = useState(3);
  const [segmentDurations, setSegmentDurations] = useState('1,3,5');
  const [maxWrong, setMaxWrong] = useState(3);

  if (!roomId) {
    return (
      <div>
        <h2>Key & Peele Game</h2>
        <div>
          <h3>Create Room</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 250 }}>
            <label>
              Your name:
              <input value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label>
              Number of rounds:
              <input type="number" value={rounds} onChange={e => setRounds(Number(e.target.value))} />
            </label>
            <label>
              Segment durations (seconds, comma-separated):
              <input value={segmentDurations} onChange={e => setSegmentDurations(e.target.value)} />
            </label>
            <label>
              Max wrong guesses per round:
              <input type="number" value={maxWrong} onChange={e => setMaxWrong(Number(e.target.value))} />
            </label>
            <button onClick={() => onCreateRoom(name, { rounds, segmentDurations: segmentDurations.split(',').map(Number), maxWrongGuessesPerRound: maxWrong })} disabled={!name}>Create Room</button>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <h3>Join Room</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 250 }}>
            <label>
              Room code:
              <input value={joinRoomId} onChange={e => setJoinRoomId(e.target.value.toUpperCase())} />
            </label>
            <label>
              Your name:
              <input value={name} onChange={e => setName(e.target.value)} />
            </label>
            <button onClick={() => onJoinRoom(joinRoomId, name)} disabled={!joinRoomId || !name}>Join</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Lobby</h2>
      <div>Room Code: <b>{roomId}</b></div>
      <div>
        <h3>Players</h3>
        <ul>
          {Object.values(players || {}).map((p: any, i: number) => (
            <li key={i}>{p.name} {p.name === playerName && '(You)'}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Rules</h3>
        {isHost ? (
          <div>
            <label>Rounds: <input type="number" value={rounds} onChange={e => setRounds(Number(e.target.value))} /></label>
            <label>Segment Durations: <input value={segmentDurations} onChange={e => setSegmentDurations(e.target.value)} /></label>
            <label>Max Wrong Guesses: <input type="number" value={maxWrong} onChange={e => setMaxWrong(Number(e.target.value))} /></label>
            <button onClick={() => onCreateRoom(playerName, { rounds, segmentDurations: segmentDurations.split(',').map(Number), maxWrongGuessesPerRound: maxWrong })}>Update Rules</button>
          </div>
        ) : (
          <div>
            <div>Rounds: {rules?.rounds}</div>
            <div>Segment Durations: {rules?.segmentDurations?.join(', ')}</div>
            <div>Max Wrong Guesses: {rules?.maxWrongGuessesPerRound}</div>
          </div>
        )}
      </div>
      {isHost ? (
        <button onClick={onStartGame}>Start Game</button>
      ) : (
        <div>Waiting for host...</div>
      )}
    </div>
  );
}
