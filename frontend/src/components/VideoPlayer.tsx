import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState } = useGame();
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const clipLength = gameState?.config?.clipLength || 5;

  // 1. Logic Guard: Check if the player is actually "alive" in the DOM
  const callPlayer = (method: string, ...args: any[]) => {
    if (!playerRef.current || !isReady) return;
    try {
      // The "reading src" error happens here. We check if getIframe exists first.
      if (playerRef.current.getIframe()) {
        playerRef.current[method](...args);
      }
    } catch (e) {
      console.warn(`YouTube API call ${method} failed:`, e);
    }
  };

  // 2. Handle Video Swapping
  useEffect(() => {
    if (isReady && youtubeId) {
      const currentData = playerRef.current?.getVideoData();
      if (currentData && currentData.video_id !== youtubeId) {
        callPlayer('loadVideoById', { videoId: youtubeId, startSeconds: 0 });
      }
    }
  }, [youtubeId, isReady]);

  // 3. Audio Loop & Phase Control
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isReady && phase === 'ROUND_PLAYING') {
      callPlayer('playVideo');
      callPlayer('unMute');
      callPlayer('setVolume', 100);

      interval = setInterval(() => {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= clipLength) {
            callPlayer('seekTo', 0, true);
          }
        } catch (e) {}
      }, 500);
    }

    if (isReady && phase === 'ROUND_REVEAL') {
        callPlayer('playVideo');
        callPlayer('unMute');
    }

    return () => clearInterval(interval);
  }, [phase, clipLength, isReady]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
    // Don't call playVideo directly on the event target here to be safe
  };

  if (!youtubeId) return <div className="video-placeholder">Loading audio...</div>;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      widget_referrer: window.location.origin
    },
  };

  return (
    <div className={`video-wrapper phase-${phase}`}>
      {/* 🛡️ STABLE ID: Using the roomCode as the key ensures the player 
          only re-mounts if the user switches rooms, not between rounds. */}
      <YouTube 
        key={gameState?.roomCode || 'global-player'}
        videoId={youtubeId} 
        opts={opts} 
        onReady={onReady} 
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
    </div>
  );
};