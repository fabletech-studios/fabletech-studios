'use client';

import { useRef, useEffect } from 'react';

interface SimpleVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function SimpleVideoPlayer({ src, poster, className = '' }: SimpleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video element is properly initialized
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        playsInline
        className="w-full h-full"
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}