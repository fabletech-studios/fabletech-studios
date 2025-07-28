'use client';

import { useState } from 'react';

interface ProxiedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ProxiedImage({ src, alt, className, onLoad, onError }: ProxiedImageProps) {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // If it's a Firebase Storage URL, try direct first, then proxy
  const isFirebaseUrl = src?.startsWith('https://storage.googleapis.com/');
  const proxiedUrl = isFirebaseUrl ? `/api/proxy/image?url=${encodeURIComponent(src)}` : src;
  
  const handleError = () => {
    if (isFirebaseUrl && retryCount === 0) {
      // First error on Firebase URL, try the proxy
      setRetryCount(1);
      setError(false);
    } else {
      // Final error
      setError(true);
      onError?.();
    }
  };
  
  const currentSrc = retryCount === 0 ? src : proxiedUrl;
  
  if (error) {
    return <div className={`${className} bg-gray-800 flex items-center justify-center`}>
      <span className="text-gray-500">Image failed to load</span>
    </div>;
  }
  
  return (
    <img 
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}