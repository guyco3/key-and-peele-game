import React, { useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState } = useGame();
  const playerRef = useRef<any>(null);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const clipLength = gameState?.config?.clipLength || 5;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'ROUND_PLAYING' && playerRef.current && youtubeId) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= clipLength) {
          playerRef.current.seekTo(0, true);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [phase, clipLength, youtubeId]);

  // Sync volume and mute status based on phase
  useEffect(() => {
    if (!playerRef.current) return;

    if (phase === 'ROUND_PLAYING') {
      playerRef.current.unMute(); // Audio ON for the hint
      playerRef.current.setVolume(100);
    } else if (phase === 'ROUND_REVEAL') {
      playerRef.current.unMute(); // Audio ON for the reveal
      playerRef.current.setVolume(100);
    }
  }, [phase]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.playVideo();
    // Ensure it starts unmuted so they can hear the hint immediately
    playerRef.current.unMute();
    playerRef.current.setVolume(100);
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Always hide controls for better security
      modestbranding: 1,
      rel: 0,
      disablekb: 1,
    },
  };

  return (
    <div className={`video-wrapper phase-${phase}`}>
      <YouTube 
        videoId={youtubeId} 
        opts={opts} 
        onReady={onReady} 
        className="youtube-embed"
      />
      
      {/* 2025/12/17: Audio-only placeholder for ROUND_PLAYING */}
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