import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import sketches from "../../shared/sketches.json";

const socket = io("http://localhost:4000");

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState("landing");
  const [round, setRound] = useState(0);
  const [video, setVideo] = useState(null);
  const [guess, setGuess] = useState("");
  const [filteredSketches, setFilteredSketches] = useState(sketches);
  const [scores, setScores] = useState({});
  const [maxWrong, setMaxWrong] = useState(3);
  
  // Volume state and ref for iframe
  const [volume, setVolume] = useState(100); // 0-100
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // relative time within the segment (0 to duration)
  const iframeRef = useRef(null);

  // Update volume on iframe when changed
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'setVolume', args: isMuted ? [] : [volume] }),
        '*'
      );
    }
  }, [volume, isMuted, video]);

  // Reset playback state when video changes
  useEffect(() => {
    if (video) {
      setIsPlaying(true); // autoplay
      setCurrentTime(0);
    }
  }, [video]);

  // Update current time while playing
  useEffect(() => {
    if (!isPlaying || !video) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const duration = video.endTime - video.startTime;
        const next = prev + 0.1;
        
        // Stop at the end of the segment
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        
        return next;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isPlaying, video]);

  // Send playback control commands to iframe
  const sendCommand = (func, args = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    sendCommand(isPlaying ? 'pauseVideo' : 'playVideo');
    setIsPlaying(!isPlaying);
  };

  const seekTo = (relativeTime) => {
    if (video) {
      const absoluteTime = video.startTime + relativeTime;
      sendCommand('seekTo', [absoluteTime, true]);
      setCurrentTime(relativeTime);
    }
  };

  const handleSeekChange = (e) => {
    const newTime = Number(e.target.value);
    seekTo(newTime);
  };

  const handleGuessChange = (value) => {
    setGuess(value);
    if (value.trim().length > 0) {
      const filtered = sketches.filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSketches(filtered);
    } else {
      setFilteredSketches(sketches); // Show all sketches when empty
    }
  };

  const selectSketch = (sketchName) => {
    setGuess(sketchName);
  };

  // Socket listeners
  useEffect(() => {
    socket.on("room_created", (room) => {
      setRoomId(room.roomId);
      setStatus(room.status);
    });

    socket.on("player_list", ({ players }) => {
      setPlayers(players);
    });

    socket.on("round_start", ({ roundNumber, video, maxWrongGuesses }) => {
      setRound(roundNumber);
      setVideo(video);
      setMaxWrong(maxWrongGuesses);
      setStatus("round");
    });

    socket.on("round_end", ({ scores, correctVideo }) => {
      setScores(scores);
      setVideo(correctVideo);
      setStatus("round_end");
    });

    socket.on("game_over", ({ leaderboard }) => {
      setStatus("game_over");
    });
  }, []);

  // Actions
  const createRoom = () => {
    socket.emit("create_room", {
      name,
      rules: { rounds: 3, maxWrongGuessesPerRound: 3 },
    });
  };

  const joinRoom = () => {
    socket.emit("join_room", { roomId, name });
  };

  const startGame = () => {
    socket.emit("start_game", { roomId });
  };

  const submitGuess = () => {
    socket.emit("submit_guess", { roomId, guess });
    setGuess("");
  };

  const endRound = () => {
    socket.emit("end_round", { roomId });
  };

  const nextRound = () => {
    socket.emit("next_round", { roomId });
  };

  // --- UI ---
  if (status === "landing")
    return (
      <div>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={createRoom}>Create Room</button>
        <input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    );

  if (status === "lobby")
    return (
      <div>
        <h2>Lobby (Room: {roomId})</h2>
        <h3>Players:</h3>
        <ul>{Object.values(players).map((p) => <li key={p.name}>{p.name}</li>)}</ul>
        <button onClick={startGame}>Start Game</button>
      </div>
    );

  if (status === "round")
    return (
      <div>
        <h2>Round {round}</h2>
        
        {/* Players and Host Controls at Top */}
        <div style={{ marginBottom: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Players:</h3>
          <ul style={{ margin: '0 0 10px 0' }}>
            {Object.entries(players).map(([id, p]) => <li key={id}>{p.name}: {p.score}</li>)}
          </ul>
          <button onClick={endRound}>End Round (Host)</button>
        </div>
        
        <div>
          {video && (
            <>
              <div style={{ 
                width: 420, 
                height: 315, 
                backgroundColor: '#1a1a1a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
                  <div>Audio Only - Guess the sketch!</div>
                </div>
              </div>
              <iframe
                ref={iframeRef}
                width="1"
                height="1"
                src={`${video.url}?start=${video.startTime}&end=${video.endTime}&autoplay=1&controls=0&enablejsapi=1`}
                allow="autoplay"
                style={{ position: 'absolute', left: '-9999px' }}
                frameBorder="0"
                title="YouTube video player"
              />
              
              {/* Playback Controls */}
              <div style={{ marginBottom: 16 }}>
                <button onClick={togglePlayPause} style={{ fontSize: 20, padding: '8px 16px' }}>
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button onClick={() => seekTo(0)} style={{ marginLeft: 8, padding: '8px 16px' }}>
                  ⏮️ Restart
                </button>
              </div>

              {/* Seek Slider */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ minWidth: 40 }}>{currentTime.toFixed(1)}s</span>
                  <input
                    type="range"
                    min={0}
                    max={video.endTime - video.startTime}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeekChange}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <span style={{ minWidth: 40 }}>{(video.endTime - video.startTime).toFixed(1)}s</span>
                </div>
              </div>

              {/* Volume Controls */}
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? '🔇 Unmute' : '🔊 Mute'}</button>
                <button onClick={() => setVolume(v => Math.max(0, v - 10))}>-</button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                  style={{ width: 100 }}
                />
                <button onClick={() => setVolume(v => Math.min(100, v + 10))}>+</button>
                <span style={{ marginLeft: 8 }}>Volume: {isMuted ? 0 : volume}</span>
              </div>
            </>
          )}
        </div>
        
        {/* Guess Input with Autocomplete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              value={guess} 
              onChange={(e) => handleGuessChange(e.target.value)} 
              placeholder="Type to search sketch names..." 
              style={{ width: 500, padding: '8px', fontSize: 14 }}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: 500,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              {filteredSketches.length > 0 ? (
                filteredSketches.map((sketch) => (
                  <div
                    key={sketch.id}
                    onClick={() => selectSketch(sketch.name)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                      {sketch.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      {sketch.description}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {sketch.tags.join(', ')}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '10px 12px', color: '#999', fontSize: 13 }}>
                  No sketches found
                </div>
              )}
            </div>
          </div>
          <button onClick={submitGuess} style={{ padding: '8px 16px', fontSize: 14 }}>Submit Guess</button>
        </div>
      </div>
    );

  if (status === "round_end")
    return (
      <div>
        <h2>Round End</h2>
        {video && (
          <>
            <iframe
              ref={iframeRef}
              width="420"
              height="315"
              src={`${video.url}?start=${video.startTime}&end=${video.endTime}&autoplay=1&controls=1&enablejsapi=1`}
              allow="autoplay"
              frameBorder="0"
              title="YouTube video player"
            />
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? 'Unmute' : 'Mute'}</button>
              <button onClick={() => setVolume(v => Math.max(0, v - 10))}>-</button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                style={{ width: 100 }}
              />
              <button onClick={() => setVolume(v => Math.min(100, v + 10))}>+</button>
              <span style={{ marginLeft: 8 }}>{isMuted ? 0 : volume}</span>
            </div>
          </>
        )}
        <h3>Scores:</h3>
        <ul>{Object.entries(scores).map(([id, p]) => <li key={id}>{p.name}: {p.score}</li>)}</ul>
        <button onClick={nextRound}>Next Round</button>
      </div>
    );

  if (status === "game_over")
    return (
      <div>
        <h2>Game Over</h2>
        <h3>Final Scores:</h3>
        <ul>{Object.entries(scores).map(([id, p]) => <li key={id}>{p.name}: {p.score}</li>)}</ul>
      </div>
    );

  return <div>Loading...</div>;
}
