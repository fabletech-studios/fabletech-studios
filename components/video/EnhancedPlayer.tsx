'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  MessageSquare,
  ChevronRight,
  Loader,
  Star,
  Heart,
  Lock,
  Unlock,
  Coins,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const EpisodeRating = dynamic(() => import('@/components/ratings/EpisodeRating'), {
  ssr: false,
  loading: () => <div className="h-20 bg-gray-800 rounded-lg animate-pulse" />
});

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  audioUrl: string;
  thumbnailUrl: string;
  duration: string;
  episodeNumber: number;
  seriesTitle: string;
  nextEpisodeId?: string;
  previousEpisodeId?: string;
  isLocked?: boolean;
  credits?: number;
}

interface EnhancedPlayerProps {
  episode: Episode;
  episodes?: Episode[];
  onEpisodeChange?: (episodeId: string) => void;
  onUnlockEpisode?: (episodeId: string) => Promise<boolean>;
  autoplay?: boolean;
  onComplete?: () => void;
  userCredits?: number;
  showRating?: boolean;
  seriesId?: string;
}

export default function EnhancedPlayer({ 
  episode, 
  episodes = [], 
  onEpisodeChange,
  onUnlockEpisode,
  autoplay = false,
  onComplete,
  userCredits = 0,
  showRating = true,
  seriesId
}: EnhancedPlayerProps) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('audio'); // Default to audio
  const [autoplayEnabled, setAutoplayEnabled] = useState(autoplay);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  
  interface Comment {
    id: string;
    userName: string;
    content: string;
    createdAt: string;
    rating?: number;
    likes?: number;
  }
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedEpisodeToUnlock, setSelectedEpisodeToUnlock] = useState<Episode | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Get active media element
  const getMediaElement = () => mediaType === 'video' ? videoRef.current : audioRef.current;

  // Initialize player
  useEffect(() => {
    const media = getMediaElement();
    if (!media) return;

    // Load saved preferences
    const savedVolume = localStorage.getItem('player_volume');
    const savedRate = localStorage.getItem('player_rate');
    const savedAutoplay = localStorage.getItem('player_autoplay');
    
    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedRate) setPlaybackRate(parseFloat(savedRate));
    if (savedAutoplay) setAutoplayEnabled(savedAutoplay === 'true');

    // Apply volume and rate immediately
    media.volume = savedVolume ? parseFloat(savedVolume) : 1;
    media.playbackRate = savedRate ? parseFloat(savedRate) : 1;

    // Set up event listeners
    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleDurationChange = () => {
      // Only update duration if it's a valid number
      if (media.duration && !isNaN(media.duration) && isFinite(media.duration)) {
        setDuration(media.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (autoplayEnabled && episode.nextEpisodeId) {
        setShowNextEpisode(true);
        startNextEpisodeCountdown();
      }
      onComplete?.();
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ended', handleEnded);
    };
  }, [mediaType, episode, autoplayEnabled]);

  // Handle media type switching
  useEffect(() => {
    const media = getMediaElement();
    if (!media) return;
    
    // Pause the previous media
    setIsPlaying(false);
    
    // Reset duration and time when switching media types
    setCurrentTime(0);
    setDuration(0);
    
    // Wait for new media to be ready
    const handleCanPlay = () => {
      // Re-apply saved preferences
      const savedVolume = localStorage.getItem('player_volume');
      const savedRate = localStorage.getItem('player_rate');
      media.volume = savedVolume ? parseFloat(savedVolume) : volume;
      media.playbackRate = savedRate ? parseFloat(savedRate) : playbackRate;
    };
    
    const handleLoadedMetadata = () => {
      // Update duration when metadata is loaded
      if (media.duration && !isNaN(media.duration) && isFinite(media.duration)) {
        setDuration(media.duration);
      }
    };
    
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [mediaType]);

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    if (showControls) hideControls();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // Fetch comments when panel opens
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const media = getMediaElement();
      if (!media) return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          setShowComments(!showComments);
          break;
        case 'Escape':
          if (isFullscreen) toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, showComments, isFullscreen]);

  // Player controls
  const togglePlay = () => {
    const media = getMediaElement();
    if (!media) return;
    
    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
  };

  const skip = (seconds: number) => {
    const media = getMediaElement();
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.currentTime + seconds, duration));
  };

  const seek = (time: number) => {
    const media = getMediaElement();
    if (!media) return;
    media.currentTime = time;
  };

  const adjustVolume = (change: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + change));
    setVolume(newVolume);
    localStorage.setItem('player_volume', newVolume.toString());
    const media = getMediaElement();
    if (media) media.volume = newVolume;
  };

  const toggleMute = () => {
    const media = getMediaElement();
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    const media = getMediaElement();
    if (!media) return;
    media.playbackRate = rate;
    setPlaybackRate(rate);
    localStorage.setItem('player_rate', rate.toString());
  };

  const switchEpisode = async (episodeId: string) => {
    const targetEpisode = episodes.find(ep => ep.id === episodeId);
    
    // Check if episode is locked
    if (targetEpisode?.isLocked) {
      setSelectedEpisodeToUnlock(targetEpisode);
      setShowUnlockModal(true);
      return;
    }
    
    setShowNextEpisode(false);
    onEpisodeChange?.(episodeId);
  };

  const handleUnlockEpisode = async () => {
    if (!selectedEpisodeToUnlock || !onUnlockEpisode) return;
    
    setIsUnlocking(true);
    try {
      const success = await onUnlockEpisode(selectedEpisodeToUnlock.id);
      if (success) {
        setShowUnlockModal(false);
        // Switch to the unlocked episode
        onEpisodeChange?.(selectedEpisodeToUnlock.id);
        setSelectedEpisodeToUnlock(null);
      }
    } catch (error) {
      console.error('Failed to unlock episode:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const startNextEpisodeCountdown = () => {
    let countdown = 10;
    const interval = setInterval(() => {
      countdown--;
      setNextEpisodeCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        if (episode.nextEpisodeId) {
          switchEpisode(episode.nextEpisodeId);
        }
      }
    }, 1000);
  };

  // Fetch comments
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/comments?episodeId=${episode.id}&seriesId=${episode.seriesTitle}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Post comment
  const postComment = async () => {
    if (!commentText.trim()) return;
    
    setIsPostingComment(true);
    try {
      // Get auth token if available
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          episodeId: episode.id,
          seriesId: episode.seriesTitle,
          content: commentText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format relative time for comments
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden group"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
      {/* Video Player */}
      {mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={episode.videoUrl}
          poster={episode.thumbnailUrl}
          className="w-full h-full"
          playsInline
        />
      ) : (
        <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black">
          <img 
            src={episode.thumbnailUrl} 
            alt={episode.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
          />
          <div className="relative z-10 text-center">
            <div className="w-48 h-48 rounded-lg shadow-2xl mb-4 mx-auto overflow-hidden bg-gray-900">
              <img 
                src={episode.thumbnailUrl} 
                alt={episode.title}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{episode.title}</h3>
            <p className="text-gray-400">{episode.seriesTitle}</p>
          </div>
        </div>
      )}

      {/* Audio Player (hidden) */}
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        className="hidden"
      />

      {/* Buffering Indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
          >
            <Loader className="w-12 h-12 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Episode Overlay */}
      <AnimatePresence>
        {showNextEpisode && episode.nextEpisodeId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-30"
          >
            <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Up Next</h3>
              <p className="text-gray-400 mb-6">Episode {episode.episodeNumber + 1}</p>
              <div className="text-4xl font-bold text-white mb-6">{nextEpisodeCountdown}</div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNextEpisode(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => episode.nextEpisodeId && switchEpisode(episode.nextEpisodeId)}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Play Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && selectedEpisodeToUnlock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/90 z-40"
          >
            <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center">
              <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Unlock Episode</h3>
              <p className="text-gray-400 mb-4">
                Episode {selectedEpisodeToUnlock.episodeNumber}: {selectedEpisodeToUnlock.title}
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-xl font-bold text-white">
                  {selectedEpisodeToUnlock.credits || 50} Credits
                </span>
              </div>
              
              {userCredits >= (selectedEpisodeToUnlock.credits || 50) ? (
                <>
                  <p className="text-gray-400 mb-6">
                    You have {userCredits} credits available
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowUnlockModal(false);
                        setSelectedEpisodeToUnlock(null);
                      }}
                      disabled={isUnlocking}
                      className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-white font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUnlockEpisode}
                      disabled={isUnlocking}
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {isUnlocking ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Unlocking...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          Unlock Now
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-red-500 mb-6">
                    Insufficient credits ({userCredits}/{selectedEpisodeToUnlock.credits || 50})
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowUnlockModal(false);
                        setSelectedEpisodeToUnlock(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Navigate to purchase page
                        window.location.href = '/purchase';
                      }}
                      className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-semibold transition-colors"
                    >
                      Buy Credits
                    </button>
                  </div>
                </>
              )}
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
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">{episode.title}</h2>
                  <p className="text-gray-400 text-sm">{episode.seriesTitle} • Episode {episode.episodeNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMediaType(mediaType === 'video' ? 'audio' : 'video')}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                    title={mediaType === 'video' ? 'Switch to Audio' : 'Switch to Video'}
                  >
                    {mediaType === 'audio' ? <Play className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowEpisodes(!showEpisodes)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={togglePlay}
                className="p-6 bg-black/50 hover:bg-black/70 rounded-full transition-all transform hover:scale-110 pointer-events-auto"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 z-20">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="relative h-1 bg-gray-600 rounded-full overflow-hidden group/progress cursor-pointer">
                  <div 
                    className="absolute h-full bg-purple-600 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-1">
                  <span className="tabular-nums">{formatTime(currentTime)}</span>
                  <span className="tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>

                  {/* Skip buttons */}
                  <button
                    onClick={() => skip(-10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => skip(10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2 group/volume">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => adjustVolume(parseFloat(e.target.value) - volume)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-white text-xs sm:text-sm hidden sm:block">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Autoplay Toggle */}
                  <button
                    onClick={() => {
                      setAutoplayEnabled(!autoplayEnabled);
                      localStorage.setItem('player_autoplay', (!autoplayEnabled).toString());
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      autoplayEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    Autoplay
                  </button>

                  {/* Playback Speed */}
                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-2">Playback Speed</p>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`block w-full text-left px-3 py-1 rounded hover:bg-gray-800 text-sm ${
                            playbackRate === rate ? 'text-purple-500' : 'text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 w-96 h-full bg-gray-900 z-40 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Comments</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Comment form and comments list */}
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
                    rows={3}
                    disabled={isPostingComment}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={postComment}
                      disabled={isPostingComment || !commentText.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      {isPostingComment ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
                
                {/* Comments list */}
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {comment.userName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{comment.userName}</p>
                            <p className="text-gray-500 text-xs">{formatRelativeTime(comment.createdAt)}</p>
                          </div>
                          {comment.rating > 0 && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= comment.rating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                        {comment.likes > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-gray-500 text-xs">{comment.likes} likes</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episodes Panel */}
      <AnimatePresence>
        {showEpisodes && episodes.length > 0 && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="absolute top-0 left-0 w-96 h-full bg-gray-900 z-40 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Episodes</h3>
                <button
                  onClick={() => setShowEpisodes(false)}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400 transform rotate-180" />
                </button>
              </div>
              
              {/* Episodes list */}
              <div className="space-y-2">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => switchEpisode(ep.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      ep.id === episode.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Episode {ep.episodeNumber}</p>
                          {ep.isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <p className="text-sm opacity-75">{ep.title}</p>
                        {ep.isLocked && (
                          <p className="text-xs text-yellow-500 mt-1">
                            {ep.credits || 50} credits to unlock
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm opacity-75">{ep.duration}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* User credits display */}
              {userCredits !== undefined && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Your Credits:</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-500 font-bold text-lg">{userCredits}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/purchase'}
                    className="w-full mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-colors"
                  >
                    Buy More Credits
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Rating Component - Outside of main player div */}
      {showRating && seriesId && (
        <div className="mt-4">
          <EpisodeRating
            seriesId={seriesId}
            episodeId={episode.id}
            episodeNumber={episode.episodeNumber}
          />
        </div>
      )}
    </div>
  );
}