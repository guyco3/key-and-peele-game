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
    <div>
      {/* Play/Pause Controls */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onTogglePlayPause}
          style={{ fontSize: 20, padding: "8px 16px" }}
        >
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>
        <button
          onClick={onRestart}
          style={{ marginLeft: 8, padding: "8px 16px" }}
        >
          ⏮️ Restart
        </button>
      </div>

      {/* Seek Slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ minWidth: 40 }}>{currentTime.toFixed(1)}s</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ flex: 1, minWidth: 200 }}
          />
          <span style={{ minWidth: 40 }}>{duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Volume Controls */}
      <div style={{ marginTop: 8 }}>
        <button onClick={onToggleMute}>
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        <button onClick={onDecreaseVolume}>-</button>
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          style={{ width: 100 }}
        />
        <button onClick={onIncreaseVolume}>+</button>
        <span style={{ marginLeft: 8 }}>Volume: {isMuted ? 0 : volume}</span>
      </div>
    </div>
  );
}
