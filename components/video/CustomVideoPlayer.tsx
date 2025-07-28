'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  ChevronRight,
  Loader2,
  FastForward,
  Rewind
} from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import ProxiedMedia from '@/components/ProxiedMedia';
import { useVideoGestures } from '@/hooks/useVideoGestures';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  watermarkText?: string;
  episodeTitle?: string;
  seriesTitle?: string;
  episodeId?: string;
  seriesId?: string;
  nextEpisodeId?: string;
  className?: string;
  hideTitle?: boolean;
}

export default function CustomVideoPlayer({
  src,
  poster,
  onEnded,
  watermarkText,
  episodeTitle,
  seriesTitle,
  episodeId,
  seriesId,
  nextEpisodeId,
  className = '',
  hideTitle = false
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSeekingPreview, setIsSeekingPreview] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playbackTrackingRef = useRef<NodeJS.Timeout>();
  const lastTrackedTime = useRef(0);
  const [showSkipAnimation, setShowSkipAnimation] = useState<'forward' | 'backward' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showGestureHelp, setShowGestureHelp] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Playback speeds
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      
      // Show gesture help on first mobile visit
      if (mobile && !localStorage.getItem('gestureHelpShown')) {
        setShowGestureHelp(true);
        localStorage.setItem('gestureHelpShown', 'true');
        setTimeout(() => setShowGestureHelp(false), 5000);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track playback
  const trackPlayback = useCallback(async (action: string) => {
    if (!episodeId || !seriesId) return;

    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
      await fetch('/api/playback/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          episodeId,
          seriesId,
          currentTime,
          duration,
          action,
          playbackSpeed: playbackRate,
          quality: 'auto'
        })
      });
    } catch (error) {
      console.error('Failed to track playback:', error);
    }
  }, [episodeId, seriesId, currentTime, duration, playbackRate]);

  // Format time display
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!videoRef.current || !isReady) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Small delay to prevent interruption
        await new Promise(resolve => setTimeout(resolve, 100));
        await videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error: any) {
      // Handle play interruption gracefully
      if (error.name === 'AbortError') {
        // Play request was interrupted - this is normal during episode changes
      } else if (error.name === 'NotAllowedError') {
        // Play requires user interaction
      } else {
        console.error('Playback error:', error);
      }
    }
  }, [isPlaying, isReady]);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Seek video - enhanced for better UX
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current && !isNaN(newTime)) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Update progress immediately for smooth scrubbing
      setProgress((newTime / duration) * 100);
    }
  };
  
  // Handle seek preview on hover
  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    setSeekPreviewTime(time);
    setIsSeekingPreview(true);
  };
  
  // Handle direct click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    
    // Show skip animation
    setShowSkipAnimation(seconds > 0 ? 'forward' : 'backward');
    setTimeout(() => setShowSkipAnimation(null), 1000);
  };

  // Gesture handlers
  useVideoGestures(containerRef, {
    onDoubleTap: (side) => {
      skip(side === 'right' ? 10 : -10);
    },
    onSwipeUp: () => {
      setVolume(prev => Math.min(1, prev + 0.1));
      if (videoRef.current) {
        videoRef.current.volume = Math.min(1, volume + 0.1);
      }
    },
    onSwipeDown: () => {
      setVolume(prev => Math.max(0, prev - 0.1));
      if (videoRef.current) {
        videoRef.current.volume = Math.max(0, volume - 0.1);
      }
    },
    onSwipeLeft: () => skip(-10),
    onSwipeRight: () => skip(10)
  });

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Change playback speed
  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSettings(false);
  };

  // Show/hide controls with timeout
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current || !containerRef.current) return;
      
      // Check if the video player container is visible
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      // Check if video player is actually in viewport
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isInViewport) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case '0':
        case 'Home':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
          }
          break;
        case 'End':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = duration;
          }
          break;
        case ',':
          e.preventDefault();
          if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            skip(-1/30); // Frame backward
          }
          break;
        case '.':
          e.preventDefault();
          if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            skip(1/30); // Frame forward
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, isPlaying, duration, showKeyboardHelp]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      
      // Track progress every 10 seconds
      if (Math.abs(video.currentTime - lastTrackedTime.current) >= 10) {
        trackPlayback('progress');
        lastTrackedTime.current = video.currentTime;
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      // Track playback start
      if (video.currentTime < 1) {
        trackPlayback('start');
      }
    };
    const handlePause = () => {
      trackPlayback('pause');
    };
    const handleEnded = () => {
      setIsPlaying(false);
      trackPlayback('complete');
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded, trackPlayback]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <ProxiedMedia
        type="video"
        videoRef={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        onLoadStart={() => {
          setIsLoading(true);
          setIsReady(false);
        }}
        onCanPlay={() => {
          setIsLoading(false);
          setIsReady(true);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Video error:', e);
          setIsLoading(false);
        }}
      />

      {/* Watermark - Made more subtle */}
      <AnimatePresence>
        {watermarkText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }} // Reduced opacity for better viewing
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 pointer-events-none select-none"
          >
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded">
              <PremiumLogo size="xs" showText={false} />
              <div className="flex flex-col">
                <span className="text-[11px] text-white/70 font-medium">{watermarkText}</span>
                {episodeTitle && (
                  <span className="text-[9px] text-white/50">{episodeTitle}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Animation */}
      <AnimatePresence>
        {showSkipAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-black/70 backdrop-blur-sm rounded-full p-4">
              {showSkipAnimation === 'forward' ? (
                <FastForward className="w-12 h-12 text-white" />
              ) : (
                <Rewind className="w-12 h-12 text-white" />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap">
                {showSkipAnimation === 'forward' ? '+10s' : '-10s'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70"
          >
            {/* Top Bar - Title */}
            {!hideTitle && (
              <div className="absolute top-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {seriesTitle && (
                      <h3 className="text-sm text-gray-400">{seriesTitle}</h3>
                    )}
                    {episodeTitle && (
                      <h2 className="text-lg font-semibold">{episodeTitle}</h2>
                    )}
                  </div>
                  <PremiumLogo size="xs" />
                </div>
              </div>
            )}

            {/* Center Play Button */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
              </button>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* Progress Bar - Enhanced for better seeking */}
              <div className="relative group/progress py-2">
                {/* Seek preview tooltip */}
                {isSeekingPreview && (
                  <div 
                    className="absolute -top-8 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none"
                    style={{ left: `${(seekPreviewTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    {formatTime(seekPreviewTime)}
                  </div>
                )}
                
                {/* Clickable progress bar container */}
                <div 
                  className="relative h-1 group-hover/progress:h-2 bg-gray-600/50 rounded-full overflow-hidden transition-all cursor-pointer"
                  onClick={handleProgressBarClick}
                  onMouseMove={handleSeekHover}
                  onMouseLeave={() => setIsSeekingPreview(false)}
                >
                  {/* Progress fill */}
                  <div 
                    className="h-full bg-red-600 pointer-events-none"
                    style={{ width: `${progress}%` }}
                  />
                  
                  {/* Scrubber handle */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${progress}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  />
                </div>
                
                {/* Hidden range input for accessibility and mobile */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} flex items-center justify-center hover:bg-white/10 rounded-full transition-colors`}
                  >
                    {isPlaying ? (
                      <Pause className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                    ) : (
                      <Play className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} ml-0.5`} fill="currentColor" />
                    )}
                  </button>

                  {/* Skip Buttons - Hidden on mobile (use gestures instead) */}
                  {!isMobile && (
                    <>
                      <button
                        onClick={() => skip(-10)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => skip(10)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Volume */}
                  <div className="flex items-center gap-2 group/volume">
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-400">{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    
                    {/* Settings Menu */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-12 right-0 bg-gray-900 rounded-lg p-2 min-w-[120px]"
                        >
                          <div className="text-xs text-gray-400 px-3 py-1">Speed</div>
                          {playbackSpeeds.map(speed => (
                            <button
                              key={speed}
                              onClick={() => changePlaybackSpeed(speed)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 rounded transition-colors ${
                                playbackRate === speed ? 'text-red-500' : ''
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Episode Preview */}
      {nextEpisodeId && currentTime > duration - 15 && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-24 right-4 bg-gray-900 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors"
          onClick={() => onEnded && onEnded()}
        >
          <div>
            <p className="text-sm text-gray-400">Next Episode</p>
            <p className="font-semibold">Starting in {Math.ceil(duration - currentTime)}s</p>
          </div>
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      )}

      {/* Mobile Gesture Help */}
      <AnimatePresence>
        {showGestureHelp && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-xs"
          >
            <h3 className="font-semibold mb-2">Gesture Controls</h3>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>• Double tap left/right: Skip 10s</li>
              <li>• Swipe up/down: Volume</li>
              <li>• Swipe left/right: Seek</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard Shortcuts Help */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
            onClick={() => setShowKeyboardHelp(false)}
          >
            <div className="bg-gray-900 rounded-lg p-6 max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="text-gray-400">Space / K</div>
                <div>Play/Pause</div>
                <div className="text-gray-400">← / J</div>
                <div>Skip back 10s</div>
                <div className="text-gray-400">→ / L</div>
                <div>Skip forward 10s</div>
                <div className="text-gray-400">↑</div>
                <div>Volume up</div>
                <div className="text-gray-400">↓</div>
                <div>Volume down</div>
                <div className="text-gray-400">M</div>
                <div>Mute/Unmute</div>
                <div className="text-gray-400">F</div>
                <div>Fullscreen</div>
                <div className="text-gray-400">Home / 0</div>
                <div>Go to start</div>
                <div className="text-gray-400">End</div>
                <div>Go to end</div>
                <div className="text-gray-400">, / .</div>
                <div>Frame back/forward</div>
                <div className="text-gray-400">?</div>
                <div>Show this help</div>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}