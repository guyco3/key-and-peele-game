import React, { useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useGame } from '../context/GameContext';

export const VideoPlayer: React.FC = () => {
  const { gameState } = useGame();
  const playerRef = useRef<any>(null);

  const phase = gameState?.phase;
  const youtubeId = gameState?.currentSketch?.youtubeId;
  const clipLength = gameState?.config?.clipLength || 5;

  // HINT LOOP: During PLAYING phase, loop the start of the video
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

  // Handle phase transitions (Auto-unmute on reveal)
  useEffect(() => {
    if (phase === 'ROUND_REVEAL' && playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(50);
    }
  }, [phase]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.playVideo();
    // Most browsers block autoplay unless the video starts muted
    if (phase === 'ROUND_PLAYING') {
      playerRef.current.mute();
    }
  };

  if (!youtubeId) return <div className="video-placeholder">Waiting for sketch...</div>;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: phase === 'ROUND_REVEAL' ? 1 : 0, // Hide controls during play
      modestbranding: 1,
      rel: 0,
      disablekb: 1, // Prevent keyboard shortcuts like 'f' for fullscreen
    },
  };

  return (
    <div className={`video-wrapper ${phase === 'ROUND_PLAYING' ? 'blurred' : 'clear'}`}>
      <YouTube 
        videoId={youtubeId} 
        opts={opts} 
        onReady={onReady} 
        className="youtube-embed"
      />
      {phase === 'ROUND_PLAYING' && (
        <div className="anti-cheat-overlay" />
      )}
    </div>
  );
};