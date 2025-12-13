import React, { useRef, useEffect } from 'react';

interface YouTubeSnippetProps {
  videoId: string;
  timestamp: number;
  duration: number;
  onEnd?: () => void;
}

export default function YouTubeSnippet({ videoId, timestamp, duration, onEnd }: YouTubeSnippetProps) {
  const playerRef = useRef<any>(null);
  const containerId = `yt-player-${videoId}-${timestamp}`;

  useEffect(() => {
    let ytPlayer: any;
    function onYouTubeIframeAPIReady() {
      ytPlayer = new (window as any).YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          start: timestamp,
          end: timestamp + duration,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e: any) => e.target.playVideo(),
          onStateChange: (e: any) => {
            if (e.data === 0 && onEnd) onEnd(); // Ended
          },
        },
      });
      playerRef.current = ytPlayer;
    }
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else {
      onYouTubeIframeAPIReady();
    }
    return () => {
      if (ytPlayer) ytPlayer.destroy();
    };
  }, [videoId, timestamp, duration]);

  return <div id={containerId} />;
}
