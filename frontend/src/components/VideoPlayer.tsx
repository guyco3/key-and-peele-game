import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState, socket, clientId, roomCode } = useGame();
  const playerRef = useRef<any>(null);
  const errorReportedRef = useRef(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // 🛡️ Guard: Track if the YouTube API is actually ready for commands
  const [isReady, setIsReady] = useState(false);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const clipLength = gameState?.config?.clipLength || 5;

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

  // Reset error state and readiness when the video changes
  useEffect(() => {
    errorReportedRef.current = false;
    setVideoError(null);
  }, [youtubeId]);

  useEffect(() => {
    if (isReady && youtubeId) {
      const currentData = playerRef.current?.getVideoData();
      if (currentData && currentData.video_id !== youtubeId) {
        callPlayer('loadVideoById', { videoId: youtubeId, startSeconds: 0 });
      }
    }
  }, [youtubeId, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'ROUND_PLAYING' && isReady) {
      interval = setInterval(() => {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= clipLength) {
            callPlayer('seekTo', 0, true);
          }
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [phase, clipLength, isReady]);

  useEffect(() => {
    if (phase === 'ROUND_PLAYING' || phase === 'ROUND_REVEAL') {
      callPlayer('playVideo');
      callPlayer('unMute');
      callPlayer('setVolume', 100);
    }
  }, [phase, isReady]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
    event.target.playVideo();
    event.target.unMute();
    event.target.setVolume(100);
  };

  const onError: YouTubeProps['onError'] = (event) => {
    if (errorReportedRef.current) return;

    const code = event.data;
    const codeDescriptions: Record<number, string> = {
      2: 'The video ID looks invalid.',
      5: 'This video cannot be played in HTML5.',
      100: 'The video was removed or set to private.',
      101: 'Playback is blocked by the owner.',
      150: 'Playback is blocked by the owner.',
    };

    const friendly = codeDescriptions[code] || 'Video is unavailable in this region.';
    const message = `Video unavailable (error ${code}). ${friendly}`;

    setVideoError(message);
    errorReportedRef.current = true;

    if (socket && roomCode && clientId && youtubeId) {
      socket.emit('video_error', { clientId, roomCode, youtubeId, errorCode: code, message });
    }
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      disablekb: 1,
      enablejsapi: 1, // 👈 Required for the API to talk to your code
      origin: window.location.origin
    },
  };

  return (
    <div className={`video-wrapper phase-${phase}`}>
      {/* 🛡️ STABLE KEY: Prevents React from killing the player between rounds */}
      <YouTube 
        key={roomCode || 'global-player'}
        videoId={youtubeId} 
        opts={opts} 
        onReady={onReady} 
        onError={onError}
        className="youtube-embed"
      />
      
      {phase === 'ROUND_PLAYING' && (
        <div className="audio-only-overlay">
          <div className="audio-icon">🔊</div>
          <p>Listen closely...</p>
          <div className="audio-waves">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      )}

      {videoError && (
        <div className="video-error-banner">
          <div className="error-title">Video unavailable</div>
          <p>{videoError}</p>
          <p>The host is being notified...</p>
        </div>
      )}
    </div>
  );
};