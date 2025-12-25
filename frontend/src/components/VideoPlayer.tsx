import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState, socket, clientId, roomCode } = useGame();
  const playerRef = useRef<any>(null);
  const errorReportedRef = useRef(false);
  const manualPauseRef = useRef(false);

  const [videoError, setVideoError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Strict Mobile Detection (OS Level Only)
  const [isActualMobileDevice, setIsActualMobileDevice] = useState(false);

  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const startSec = gameState?.currentSketch?.startTime || 0;
  const clipLength = gameState?.config?.clipLength || 5;
  const endSec = startSec + clipLength;

  // --- 1. STRICT DEVICE CHECK ---
  useEffect(() => {
    const isMobileOS = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsActualMobileDevice(isMobileOS);
  }, []);

  const callPlayer = (method: string, ...args: any[]) => {
    if (!playerRef.current || !isReady) return;
    try {
      if (playerRef.current.getIframe()) {
        playerRef.current[method](...args);
      }
    } catch (e) {}
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
      setIsBuffering(false);
    } else if (event.data === 3) {
      setIsBuffering(true);
    } else {
      setIsPlaying(false);
      setIsBuffering(false);
    }
  };

  // --- 2. OPTIMIZED OVERLAY LOGIC ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Condition: Round is active, we are on a mobile device, video isn't moving, 
    // it's not currently buffering a loop, and the user hasn't manually paused.
    const needsManualTrigger = 
      phase === 'ROUND_PLAYING' && 
      isActualMobileDevice && 
      !isPlaying && 
      !isBuffering && 
      !manualPauseRef.current;

    if (needsManualTrigger) {
      // Small 400ms buffer allows the API to transition 
      // without flickering the UI during loops or unpausing.
      timer = setTimeout(() => setShowOverlay(true), 200);
    } else {
      setShowOverlay(false);
    }

    return () => clearTimeout(timer);
  }, [isPlaying, isBuffering, phase, isActualMobileDevice]);

  const togglePlay = () => {
    if (playerRef.current) {
      const internalState = playerRef.current.getPlayerState();
      if (internalState === 1) {
        manualPauseRef.current = true;
        callPlayer('pauseVideo');
      } else {
        manualPauseRef.current = false;
        callPlayer('playVideo');
      }
    }
  };

  const restartClip = () => {
    manualPauseRef.current = false;
    callPlayer('seekTo', startSec, true);
    callPlayer('playVideo');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newTime = startSec + (clipLength * (percent / 100));
    callPlayer('seekTo', newTime, true);
    setProgress(percent);
  };

  useEffect(() => {
    errorReportedRef.current = false;
    setVideoError(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setShowOverlay(false);
    setProgress(0);
    setCurrentTime(0);
    manualPauseRef.current = false;
  }, [youtubeId]);

  useEffect(() => {
    if (isReady && youtubeId) {
      const currentData = playerRef.current?.getVideoData();
      if (currentData && currentData.video_id !== youtubeId) {
        callPlayer('loadVideoById', { videoId: youtubeId, startSeconds: startSec });
      } else {
        callPlayer('seekTo', startSec, true);
        callPlayer('playVideo');
      }
    }
  }, [youtubeId, startSec, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'ROUND_PLAYING' && isReady) {
      interval = setInterval(() => {
        try {
          const internalState = playerRef.current.getPlayerState();
          const actuallyPlaying = internalState === 1;
          const actuallyBuffering = internalState === 3;
          
          if (actuallyPlaying !== isPlaying) setIsPlaying(actuallyPlaying);
          if (actuallyBuffering !== isBuffering) setIsBuffering(actuallyBuffering);

          const rawTime = playerRef.current.getCurrentTime();
          const relativePos = ((rawTime - startSec) / clipLength) * 100;
          setCurrentTime(Math.max(0, rawTime - startSec));
          setProgress(Math.min(Math.max(relativePos, 0), 100));
          
          if (rawTime >= endSec) {
            callPlayer('seekTo', startSec, true);
            callPlayer('playVideo');
          }
        } catch (e) {}
      }, 200);
    }
    return () => clearInterval(interval);
  }, [phase, startSec, clipLength, isReady, endSec, isPlaying, isBuffering]);

  useEffect(() => {
    if (phase === 'ROUND_PLAYING' || phase === 'ROUND_REVEAL') {
      callPlayer('playVideo');
      callPlayer('unMute');
      callPlayer('setVolume', volume);
    }
  }, [phase, isReady, volume]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
    try {
      event.target.seekTo(startSec, true);
      event.target.unMute();
      event.target.setVolume(volume);
      event.target.playVideo();
    } catch (e) {}
  };

  const onError: YouTubeProps['onError'] = (event) => {
    if (errorReportedRef.current) return;
    const code = event.data;
    setVideoError(`Video error ${code}.`);
    errorReportedRef.current = true;
    if (socket && roomCode && clientId && youtubeId) {
      socket.emit('video_error', { clientId, roomCode, youtubeId, errorCode: code, message: `Error ${code}` });
    }
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  return (
    <div className={`video-wrapper phase-${phase}`}>
      <YouTube 
        key={roomCode || 'global-player'}
        videoId={youtubeId} 
        onStateChange={onStateChange} 
        opts={{
          height: '100%',
          width: '100%',
          playerVars: { 
            autoplay: 1, 
            controls: 0, 
            modestbranding: 1, 
            rel: 0, 
            disablekb: 1, 
            start: startSec, 
            enablejsapi: 1,
            origin: window.location.origin 
          }
        }} 
        onReady={onReady} 
        onError={onError}
        className="youtube-embed"
      />
      
      {phase === 'ROUND_PLAYING' && (
        <div className="video-overlay centered-ui">
           {showOverlay && (
             <div className="mobile-force-play-overlay" onClick={togglePlay}>
                <div className="play-prompt-card">
                  <PlayArrowIcon sx={{ fontSize: '4rem', color: 'white' }} />
                  <p>Tap to Play Audio</p>
                </div>
             </div>
           )}

           <div className="audio-visualizer">
              <span className="chalk-textured-text header-text">
                {isPlaying ? "Audio is playing..." : "Audio paused"} 
              </span>
              
              <div className="manual-controls">
                <div className="control-row-btns">
                  <button onClick={togglePlay} className="btn-host ghost" title={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <PauseIcon sx={{ fontSize: '1.8rem' }} /> : <PlayArrowIcon sx={{ fontSize: '1.8rem' }} />}
                  </button>
                  <button onClick={restartClip} className="btn-join ghost" title="Restart Clip">
                    <ReplayIcon sx={{ fontSize: '1.8rem' }} />
                  </button>
                </div>

                <div className="control-slider">
                  <span className="slider-icon">🔊</span>
                  <input 
                    type="range" min="0" max="100" 
                    value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} 
                  />
                </div>

                <div className="control-slider">
                  <span className="timestamp-display">
                    {currentTime.toFixed(1)}s
                  </span>
                  <input 
                    type="range" min="0" max="100" step="0.1"
                    value={progress} onChange={handleSeek} 
                  />
                </div>
              </div>
            </div>
        </div>
      )}

      {videoError && (
        <div className="video-error-banner">
          <div className="error-title">Video unavailable</div>
          <p>{videoError}</p>
        </div>
      )}
    </div>
  );
};