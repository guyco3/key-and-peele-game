import React, { useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import type { Video } from "../../../shared";

interface VideoPlayerProps {
  video: Video;
  autoplay?: boolean;
}

export default function VideoPlayer({ video, autoplay = true }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reset iframe when video changes
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.src = iframe.src; // Force reload
    }
  }, [video.url]);

  return (
    <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom textAlign="center" fontWeight={600}>
        Watch the Clip!
      </Typography>
      <Box
        sx={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <iframe
          ref={iframeRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          src={`${video.url}?start=${video.startTime}&end=${video.endTime}&autoplay=${autoplay ? 1 : 0}&controls=1&enablejsapi=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          frameBorder="0"
          title="YouTube video player"
        />
      </Box>
      <Typography variant="body2" textAlign="center" color="text.secondary" mt={1}>
        {video.name}
      </Typography>
    </Box>
  );
}

