'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Music
} from 'lucide-react';
import ProxiedMedia from '@/components/ProxiedMedia';
import ProxiedImage from '@/components/ProxiedImage';

interface AudioOnlyPlayerProps {
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

export default function AudioOnlyPlayer({
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
}: AudioOnlyPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const lastToggleRef = useRef(0);
  
  // Component mount tracking

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Play/pause - simplified
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

  // Audio event listeners
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
    
    // Reset states when audio source changes
    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    
    // Reset current time without pausing
    audio.currentTime = 0;

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
        isPlayingRef.current = true;
      }
    };
    const handlePause = () => {
      if (mountedRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsReady(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, onEnded, audioPath]);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        {/* Background Image */}
        {thumbnailPath && (
          <ProxiedImage
            src={thumbnailPath}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        
        {/* Center Display */}
        <div className="relative z-10 text-center p-8 max-w-2xl">
          {thumbnailPath ? (
            <motion.div
              key={thumbnailPath}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-48 h-48 mx-auto mb-6"
            >
              <ProxiedImage
                src={thumbnailPath}
                alt={title}
                className="w-full h-full rounded-lg shadow-2xl object-cover"
              />
            </motion.div>
          ) : (
            <div className="w-48 h-48 rounded-lg mx-auto mb-6 bg-gray-800 flex items-center justify-center">
              <Music className="w-24 h-24 text-gray-600" />
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-gray-400 mb-8">Episode {episodeNumber}</p>
          </motion.div>
          
          {/* Custom Audio Controls */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => skip(-10)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={(e) => togglePlay(e)}
                disabled={!isReady}
                className="w-14 h-14 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-500 rounded-full transition-colors"
              >
                {!isReady ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
                )}
              </button>
              
              <button
                onClick={() => skip(10)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center gap-2 max-w-xs mx-auto">
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
        
        {/* Episode Navigation Buttons */}
        {(onPrevious || onNext) && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasPrevious
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              }`}
            >
              <SkipBack className="w-4 h-4" />
              Previous
            </button>
            
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasNext
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              }`}
            >
              Next
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}