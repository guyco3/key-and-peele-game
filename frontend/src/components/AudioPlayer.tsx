import React from "react";
import { Video } from "../context/GameContext";

interface AudioPlayerProps {
  video: Video;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function AudioPlayer({ video, iframeRef }: AudioPlayerProps) {
  return (
    <>
      <div
        style={{
          width: 420,
          height: 315,
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
          <div>Audio Only - Guess the sketch!</div>
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
    </>
  );
}
