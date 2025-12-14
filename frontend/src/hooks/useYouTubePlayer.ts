import { useRef, useState, useEffect } from "react";
import { Video } from "../context/GameContext";

export function useYouTubePlayer(video: Video | null) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Reset playback state when video changes
  useEffect(() => {
    if (video) {
      setIsPlaying(true);
      setCurrentTime(0);
    }
  }, [video]);

  // Update current time while playing
  useEffect(() => {
    if (!isPlaying || !video) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const duration = video.endTime - video.startTime;
        const next = prev + 0.1;

        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, video]);

  // Update volume on iframe
  useEffect(() => {
    if (iframeRef.current && video) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: isMuted ? "mute" : "setVolume",
          args: isMuted ? [] : [volume],
        }),
        "*"
      );
    }
  }, [volume, isMuted, video]);

  const sendCommand = (func: string, args: unknown[] = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  const play = () => {
    sendCommand("playVideo");
    setIsPlaying(true);
  };

  const pause = () => {
    sendCommand("pauseVideo");
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = (relativeTime: number) => {
    if (video) {
      const absoluteTime = video.startTime + relativeTime;
      sendCommand("seekTo", [absoluteTime, true]);
      setCurrentTime(relativeTime);
    }
  };

  const restart = () => {
    seek(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const increaseVolume = () => {
    setVolume((v) => Math.min(100, v + 10));
    setIsMuted(false);
  };

  const decreaseVolume = () => {
    setVolume((v) => Math.max(0, v - 10));
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
  };

  return {
    iframeRef,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    play,
    pause,
    togglePlayPause,
    seek,
    restart,
    toggleMute,
    increaseVolume,
    decreaseVolume,
    changeVolume,
  };
}
