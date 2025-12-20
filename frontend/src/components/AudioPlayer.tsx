import React from "react";
import { Video } from "../context/GameContext";

interface AudioPlayerProps {
  video: Video;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function AudioPlayer({ video, iframeRef }: AudioPlayerProps) {
  return (
    <div className="audio-shell">
      <div className="audio-shell__label">
        <div style={{ fontSize: 42, lineHeight: 1 }}>🎙️</div>
        <div>
          <h3 style={{ margin: 0 }}>Audio Only</h3>
          <p className="muted">Listen close and call the Key & Peele sketch.</p>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        width="1"
        height="1"
        src={`${video.url}?start=${video.startTime}&end=${video.endTime}&autoplay=1&controls=0&enablejsapi=1`}
        allow="autoplay"
        style={{ position: "absolute", left: "-9999px" }}
        frameBorder="0"
        title="YouTube video player"
      />
    </div>
  );
}
