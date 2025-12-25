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
  
  // This flag keeps the overlay hidden once the user has started the audio
  const [hasInteracted, setHasInteracted] = useState(false);

  const [videoError, setVideoError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActualMobile, setIsActualMobile] = useState(false);

  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const startSec = gameState?.currentSketch?.startTime || 0;
  const clipLength = gameState?.config?.clipLength || 5;
  const endSec = startSec + clipLength;

  // 1. Strict OS-level mobile check
  useEffect(() => {
    setIsActualMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
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
    if (event.data === 1) setIsPlaying(true);
    else setIsPlaying(false);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      const internalState = playerRef.current.getPlayerState();
      // Once they click anything, we consider the "Autoplay Block" bypassed
      setHasInteracted(true); 

      if (internalState === 1) {
        callPlayer('pauseVideo');
      } else {
        callPlayer('playVideo');
      }
    }
  };

  const restartClip = () => {
    setHasInteracted(true);
    callPlayer('seekTo', startSec, true);
    callPlayer('playVideo');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newTime = startSec + (clipLength * (percent / 100));
    callPlayer('seekTo', newTime, true);
    setProgress(percent);
  };

  // 2. Reset everything when a new sketch starts
  useEffect(() => {
    errorReportedRef.current = false;
    setVideoError(null);
    setIsPlaying(false);
    setHasInteracted(false); // Reset interaction for new round
    setProgress(0);
    setCurrentTime(0);
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
          if (actuallyPlaying !== isPlaying) setIsPlaying(actuallyPlaying);

          const rawTime = playerRef.current.getCurrentTime();
          const relativePos = ((rawTime - startSec) / clipLength) * 100;
          setCurrentTime(Math.max(0, rawTime - startSec));
          setProgress(Math.min(Math.max(relativePos, 0), 100));
          
          if (rawTime >= endSec) {
            callPlayer('seekTo', startSec, true);
            // On some mobile browsers, re-triggering play helps loop smoothly
            callPlayer('playVideo');
          }
        } catch (e) {}
      }, 150);
    }
    return () => clearInterval(interval);
  }, [phase, startSec, clipLength, isReady, endSec, isPlaying]);

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
    setVideoError(`Video error ${event.data}.`);
    errorReportedRef.current = true;
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  // 3. SNAPPY LOGIC:
  // Show overlay INSTANTLY if it's mobile, the round is playing, 
  // and the user hasn't successfully tapped to play yet.
  const showMobileOverlay = isActualMobile && phase === 'ROUND_PLAYING' && !hasInteracted && !isPlaying;

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
           
           {showMobileOverlay && (
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
                {/* Sliders remain here... */}
                <div className="control-slider">
                  <span className="slider-icon">🔊</span>
                  <input type="range" min="0" max="100" value={volume} onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setVolume(val);
                    callPlayer('setVolume', val);
                  }} />
                </div>
                <div className="control-slider">
                  <span className="timestamp-display">{currentTime.toFixed(1)}s</span>
                  <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} />
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};