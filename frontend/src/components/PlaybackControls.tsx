import React from "react";
import { Video } from "../context/GameContext";

interface PlaybackControlsProps {
  video: Video;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  onTogglePlayPause: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onIncreaseVolume: () => void;
  onDecreaseVolume: () => void;
}

export default function PlaybackControls({
  video,
  isPlaying,
  currentTime,
  volume,
  isMuted,
  onTogglePlayPause,
  onRestart,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onIncreaseVolume,
  onDecreaseVolume,
}: PlaybackControlsProps) {
  const duration = video.endTime - video.startTime;

  return (
    <div className="controls">
      <div className="controls__row">
        <button onClick={onTogglePlayPause} className="btn btn-primary">
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>
        <button onClick={onRestart} className="btn btn-ghost">
          ⏮️ Restart
        </button>
      </div>

      <div className="controls__row">
        <span className="pill">{currentTime.toFixed(1)}s</span>
        <input
          className="range"
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <span className="pill">{duration.toFixed(1)}s</span>
      </div>

      <div className="controls__row">
        <button onClick={onToggleMute} className="btn btn-ghost">
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        <button onClick={onDecreaseVolume} className="btn btn-quiet">
          -
        </button>
        <input
          className="range"
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
        <button onClick={onIncreaseVolume} className="btn btn-quiet">
          +
        </button>
        <span className="pill">Volume: {isMuted ? 0 : volume}</span>
      </div>
    </div>
  );
}
