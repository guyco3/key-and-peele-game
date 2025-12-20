import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';
import { Box } from '@mui/material';

export const VideoPlayer: React.FC = () => {
  const { gameState } = useGame();
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const clipLength = gameState?.config?.clipLength || 5;

  const callPlayer = (method: string, ...args: any[]) => {
    if (!playerRef.current || !isReady) return;
    try {
      if (playerRef.current.getIframe) {
        playerRef.current[method](...args);
      }
    } catch (e) {
      console.warn(`YouTube API call ${method} failed:`, e);
    }
  };

  useEffect(() => {
    if (isReady && youtubeId) {
      const currentData = playerRef.current?.getVideoData?.();
      if (currentData && currentData.video_id !== youtubeId) {
        callPlayer('loadVideoById', { videoId: youtubeId, startSeconds: 0 });
      }
    }
  }, [youtubeId, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, clipLength, isReady]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
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
    <Box className={`video-wrapper phase-${phase}`} sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box className="video-inner" sx={{ width: '100%', maxWidth: 1100, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', height: '100%', maxHeight: '100%', aspectRatio: '16/9' }}>
          <YouTube
            key={gameState?.roomCode || 'global-player'}
            videoId={youtubeId}
            opts={opts}
            onReady={onReady}
            className="youtube-embed"
          />
        </Box>
      </Box>

      {phase === 'ROUND_PLAYING' && (
        <div className="audio-only-overlay">
          <div className="audio-icon">🔊</div>
          <p>Listen closely...</p>
          <div className="audio-waves">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      )}
    </Box>
  );
};