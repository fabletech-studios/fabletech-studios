'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Smartphone, Monitor, Wifi } from 'lucide-react';

export default function TestPlaybackPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [videoLoadTime, setVideoLoadTime] = useState<number | null>(null);
  const [audioLoadTime, setAudioLoadTime] = useState<number | null>(null);
  const [connectionSpeed, setConnectionSpeed] = useState<string>('Unknown');
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android.*(?!Mobile)/i.test(userAgent);
    
    let device = 'Desktop';
    if (isMobile && !isTablet) device = 'Mobile';
    else if (isTablet) device = 'Tablet';
    
    setDeviceInfo(`${device} - ${navigator.platform}`);

    // Estimate connection speed (simplified)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        setConnectionSpeed(connection.effectiveType.toUpperCase());
      }
    }
  }, []);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        const startTime = performance.now();
        videoRef.current.play().then(() => {
          const loadTime = performance.now() - startTime;
          setVideoLoadTime(loadTime);
        });
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        const startTime = performance.now();
        audioRef.current.play().then(() => {
          const loadTime = performance.now() - startTime;
          setAudioLoadTime(loadTime);
        });
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Media Playback Performance Test</h1>
        
        {/* Device & Connection Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm text-gray-400">Device</div>
              <div className="font-semibold">{deviceInfo}</div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-3">
            <Wifi className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm text-gray-400">Connection</div>
              <div className="font-semibold">{connectionSpeed}</div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm text-gray-400">Screen</div>
              <div className="font-semibold">{screen.width}x{screen.height}</div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-2">Test Instructions:</h2>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>• Test video and audio playback on your device</li>
            <li>• Check loading times and playback quality</li>
            <li>• Verify smooth streaming without buffering</li>
            <li>• Test on different network conditions if possible</li>
          </ul>
        </div>

        {/* Video Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-600" />
            Video Playback Test
          </h2>
          
          <div className="aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              preload="metadata"
              controls
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              {/* Sample video - you can replace with actual test content */}
              <source src="https://sample-videos.com/zip/10/mp4/480/SampleVideo_640x360_1mb_mp4.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <button
                  onClick={handleVideoPlay}
                  className="bg-red-600 hover:bg-red-700 rounded-full p-4"
                >
                  <Play className="w-8 h-8" />
                </button>
              </div>
            )}
          </div>
          
          {videoLoadTime && (
            <div className="text-sm text-green-400">
              Video started playing in {videoLoadTime.toFixed(0)}ms
            </div>
          )}
        </div>

        {/* Audio Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-green-600" />
            Audio Playback Test
          </h2>
          
          <div className="bg-gray-800 rounded-lg p-8 mb-4">
            <audio
              ref={audioRef}
              className="w-full"
              controls
              preload="metadata"
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
            >
              {/* Sample audio - you can replace with actual test content */}
              <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
          
          {audioLoadTime && (
            <div className="text-sm text-green-400">
              Audio started playing in {audioLoadTime.toFixed(0)}ms
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Notes</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-400 mb-2">Optimal Performance Guidelines:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Video: Loading time should be &lt; 3 seconds</li>
                <li>• Audio: Loading time should be &lt; 1 second</li>
                <li>• No buffering during playback</li>
                <li>• Smooth seeking and scrubbing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-green-400 mb-2">Mobile Optimization:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Videos should auto-adjust quality based on connection</li>
                <li>• Audio should start quickly on cellular networks</li>
                <li>• Battery usage should be reasonable</li>
                <li>• UI controls should be touch-friendly</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-yellow-400 mb-2">Recommended Formats:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Video: MP4 with H.264 codec, 720p-1080p, 1-3 Mbps</li>
                <li>• Audio: MP3 (128-192 kbps) or AAC (128 kbps)</li>
                <li>• Progressive download enabled</li>
                <li>• Proper headers for streaming</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}