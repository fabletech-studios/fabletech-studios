'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Music,
  Gauge,
  X
} from 'lucide-react';
import ProxiedMedia from '@/components/ProxiedMedia';
import ProxiedImage from '@/components/ProxiedImage';

interface EnhancedAudioPlayerProps {
  audioPath: string;
  thumbnailPath?: string;
  title: string;
  episodeNumber: number;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function EnhancedAudioPlayer({
  audioPath,
  thumbnailPath,
  title,
  episodeNumber,
  onTimeUpdate,
  onEnded,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isChangingSpeed, setIsChangingSpeed] = useState(false);
  const mountedRef = useRef(false);
  
  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    try {
      if (audioRef.current.paused) {
        // Stop other media before playing
        const allAudio = document.querySelectorAll('audio');
        const allVideo = document.querySelectorAll('video');
        allAudio.forEach(a => { if (a !== audioRef.current) a.pause(); });
        allVideo.forEach(v => v.pause());
        
        audioRef.current.play().catch(err => {
          console.error('Play error:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
    }
  }, []);

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Change playback speed
  const changeSpeed = (speed: number) => {
    if (!audioRef.current || isChangingSpeed || speed === playbackSpeed) return;
    
    setIsChangingSpeed(true);
    setShowSpeedMenu(false);
    
    try {
      // Store current time to prevent restart
      const currentTimeBeforeChange = audioRef.current.currentTime;
      const wasPlaying = !audioRef.current.paused;
      
      // Change the playback rate
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      
      // Ensure time didn't reset
      if (audioRef.current.currentTime !== currentTimeBeforeChange) {
        audioRef.current.currentTime = currentTimeBeforeChange;
      }
      
      // Force ready state on mobile where it might get stuck
      if (wasPlaying) {
        setIsReady(true);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error changing playback speed:', error);
    } finally {
      // Quick reset for mobile
      requestAnimationFrame(() => {
        setIsChangingSpeed(false);
      });
    }
  };

  // Track component mount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Only reset when audio source actually changes, not on speed changes
    const isNewAudioSource = audio.src !== audioPath;
    
    if (isNewAudioSource) {
      // Reset states when audio source changes
      setIsPlaying(false);
      setIsReady(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    }
    
    // Set playback rate
    audio.playbackRate = playbackSpeed;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) onTimeUpdate(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };
    
    const handleCanPlay = () => {
      setIsReady(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handlePlay = () => {
      if (mountedRef.current) {
        setIsPlaying(true);
      }
    };
    
    const handlePause = () => {
      if (mountedRef.current) {
        setIsPlaying(false);
      }
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsReady(false);
    };
    
    const handleWaiting = () => {
      // Don't show loading during speed changes
      if (!isChangingSpeed && mountedRef.current) {
        setIsReady(false);
      }
    };
    
    const handlePlaying = () => {
      if (mountedRef.current) {
        setIsReady(true);
        setIsPlaying(true);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [onTimeUpdate, onEnded, audioPath]);

  // Separate effect for playback rate to avoid resetting audio
  useEffect(() => {
    if (audioRef.current && !isChangingSpeed) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isChangingSpeed]);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative">
        {/* Main Content Area */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
          {/* Background Image */}
          {thumbnailPath && (
            <ProxiedImage
              src={thumbnailPath}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          
          {/* Center Display */}
          <div className="relative z-10 text-center p-4 sm:p-8 max-w-2xl w-full">
            {thumbnailPath ? (
              <div className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-4 sm:mb-6">
                <ProxiedImage
                  src={thumbnailPath}
                  alt={title}
                  className="w-full h-full rounded-lg shadow-2xl object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-lg mx-auto mb-4 sm:mb-6 bg-gray-800 flex items-center justify-center">
                <Music className="w-16 h-16 sm:w-24 sm:h-24 text-gray-600" />
              </div>
            )}
            
            <div>
              <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{title}</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-8">Episode {episodeNumber}</p>
            </div>
            
            {/* Custom Audio Controls - Now outside navigation area */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <button
                  onClick={() => skip(-10)}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <button
                  onClick={togglePlay}
                  disabled={!isReady || isChangingSpeed}
                  className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-500 rounded-full transition-colors"
                >
                  {!isReady && !isChangingSpeed ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" fill="currentColor" />
                  )}
                </button>
                
                <button
                  onClick={() => skip(10)}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              {/* Volume and Speed Controls */}
              <div className="flex items-center justify-between gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
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
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
                
                {/* Speed Control */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors text-sm"
                  >
                    <Gauge className="w-4 h-4" />
                    <span>{playbackSpeed}x</span>
                  </button>
                  
                  {showSpeedMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSpeedMenu(false)}
                      />
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="py-1">
                          {PLAYBACK_SPEEDS.map(speed => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-left ${
                                speed === playbackSpeed ? 'bg-red-600 hover:bg-red-700' : ''
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Hidden Audio Element */}
            <ProxiedMedia
              type="audio"
              audioRef={audioRef}
              src={audioPath}
              preload="metadata"
              playsInline
              controls={false}
            />
          </div>
        </div>
        
        {/* Episode Navigation Buttons - Now separate from audio controls */}
        {(onPrevious || onNext) && (
          <div className="bg-gray-800 p-4 flex justify-between items-center">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                hasPrevious
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <SkipBack className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                hasNext
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}