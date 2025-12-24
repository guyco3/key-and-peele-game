import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState, socket, clientId, roomCode } = useGame();
  const playerRef = useRef<any>(null);
  const errorReportedRef = useRef(false);
  
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // --- STATE FOR MANUAL CONTROLS ---
  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const startSec = gameState?.currentSketch?.startTime || 0;
  const clipLength = gameState?.config?.clipLength || 5;
  const endSec = startSec + clipLength;

  const callPlayer = (method: string, ...args: any[]) => {
    if (!playerRef.current || !isReady) return;
    try {
      if (playerRef.current.getIframe()) {
        playerRef.current[method](...args);
      }
    } catch (e) {
      console.warn(`YouTube call ${method} failed:`, e);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    callPlayer('setVolume', val);
  };

  const togglePlay = () => {
    if (isPlaying) {
      callPlayer('pauseVideo');
      setIsPlaying(false);
    } else {
      callPlayer('playVideo');
      setIsPlaying(true);
    }
  };

  const restartClip = () => {
    callPlayer('seekTo', startSec, true);
    callPlayer('playVideo');
    setIsPlaying(true);
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
  }, [youtubeId]);

  useEffect(() => {
    if (isReady && youtubeId) {
      const currentData = playerRef.current?.getVideoData();
      if (currentData && currentData.video_id !== youtubeId) {
        callPlayer('loadVideoById', { videoId: youtubeId, startSeconds: startSec });
      } else {
        callPlayer('seekTo', startSec, true);
      }
      setIsPlaying(true);
    }
  }, [youtubeId, startSec, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'ROUND_PLAYING' && isReady) {
      interval = setInterval(() => {
        try {
          const rawTime = playerRef.current.getCurrentTime();
          const relativePos = ((rawTime - startSec) / clipLength) * 100;
          setCurrentTime(Math.max(0, rawTime - startSec));
          setProgress(Math.min(Math.max(relativePos, 0), 100));
          if (rawTime >= endSec) {
            callPlayer('seekTo', startSec, true);
          }
        } catch (e) {}
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase, startSec, clipLength, isReady, endSec]);

  useEffect(() => {
    if (phase === 'ROUND_PLAYING' || phase === 'ROUND_REVEAL') {
      callPlayer('playVideo');
      callPlayer('unMute');
      callPlayer('setVolume', volume);
      setIsPlaying(true);
    }
  }, [phase, isReady, volume]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
    try {
      event.target.seekTo(startSec, true);
      event.target.playVideo();
      event.target.unMute();
      event.target.setVolume(volume);
    } catch (e) {}
  };

  const onError: YouTubeProps['onError'] = (event) => {
    if (errorReportedRef.current) return;
    const code = event.data;
    const message = `Video error ${code}.`;
    setVideoError(message);
    errorReportedRef.current = true;
    if (socket && roomCode && clientId && youtubeId) {
      socket.emit('video_error', { clientId, roomCode, youtubeId, errorCode: code, message });
    }
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  return (
    <div className={`video-wrapper phase-${phase}`}>
      <YouTube 
        key={roomCode || 'global-player'}
        videoId={youtubeId} 
        opts={{
          height: '100%',
          width: '100%',
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, disablekb: 1, start: startSec, enablejsapi: 1 }
        }} 
        onReady={onReady} 
        onError={onError}
        className="youtube-embed"
      />
      
      {phase === 'ROUND_PLAYING' && (
        <div className="video-overlay centered-ui">
           <div className="audio-visualizer">
              <span className="chalk-textured-text header-text">
                Audio is playing... 
              </span>
              
              <div className="audio-waves">
                <span></span><span></span><span></span><span></span>
              </div>

              <div className="manual-controls">
                <div className="control-row-btns">
                  <button onClick={togglePlay} className="btn-host ghost" title={isPlaying ? "Pause" : "Play"}>
                    <span>{isPlaying ? 'Ⅱ' : '▶'}</span>
                  </button>
                  <button onClick={restartClip} className="btn-join ghost" title="Restart Clip">
                    <span>↻</span>
                  </button>
                </div>

                <div className="control-slider">
                  <span className="slider-icon">🔊</span>
                  <input 
                    type="range" min="0" max="100" 
                    value={volume} onChange={handleVolumeChange} 
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