'use client';

import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/fantasy/index.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onReady?: (player: videojs.Player) => void;
}

export default function VideoPlayer({ src, poster, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
          src,
          type: 'application/x-mpegURL'
        }],
        poster
      }, () => {
        onReady?.(player);
      });

      player.addClass('vjs-theme-fantasy');
    }
  }, [src, poster, onReady]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
}