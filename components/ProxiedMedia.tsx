'use client';

import { useState, useRef, useEffect } from 'react';

interface ProxiedMediaProps {
  src: string;
  type: 'video' | 'audio';
  poster?: string;
  className?: string;
  onError?: () => void;
  onCanPlay?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  audioRef?: React.RefObject<HTMLAudioElement>;
  [key: string]: any; // Allow other props to pass through
}

export function useProxiedMedia(originalSrc: string | undefined) {
  const [src, setSrc] = useState(originalSrc);
  const [useProxy, setUseProxy] = useState(false);
  
  useEffect(() => {
    setSrc(originalSrc);
    setUseProxy(false);
  }, [originalSrc]);
  
  const handleError = () => {
    if (originalSrc?.startsWith('https://storage.googleapis.com/') && !useProxy) {
      // Try proxy on first error
      setSrc(`/api/proxy/media?url=${encodeURIComponent(originalSrc)}`);
      setUseProxy(true);
      return true; // Handled
    }
    return false; // Not handled
  };
  
  return { src, handleError };
}

export default function ProxiedMedia({ 
  src: originalSrc, 
  type, 
  poster,
  className,
  onError,
  onCanPlay,
  videoRef: externalVideoRef,
  audioRef: externalAudioRef,
  ...props 
}: ProxiedMediaProps) {
  const { src, handleError } = useProxiedMedia(originalSrc);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  
  const videoRef = externalVideoRef || internalVideoRef;
  const audioRef = externalAudioRef || internalAudioRef;
  
  const handleMediaError = () => {
    const handled = handleError();
    if (!handled && onError) {
      onError();
    }
  };
  
  if (type === 'video') {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={className}
        onError={handleMediaError}
        onCanPlay={onCanPlay}
        {...props}
      />
    );
  }
  
  return (
    <audio
      ref={audioRef}
      src={src}
      className={className}
      onError={handleMediaError}
      onCanPlay={onCanPlay}
      {...props}
    />
  );
}