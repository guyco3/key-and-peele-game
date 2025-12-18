import { useEffect, useRef } from 'react';

export const useYouTube = (isPlaying: boolean, clipLength: number = 5) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= clipLength) {
          playerRef.current.seekTo(0);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clipLength]);

  const onReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.playVideo();
  };

  return { onReady, playerRef };
};