'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import { 
  Volume2, 
  Film, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Lock,
  Coins
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import PremiumLogo from '@/components/PremiumLogo';
import EpisodeRating from '@/components/ratings/EpisodeRating';
import LanguageSelector from '@/components/LanguageSelector';

interface Episode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  title_it?: string;  // Italian title
  description?: string;
  description_it?: string;  // Italian description
  videoPath: string;
  videoPath_it?: string;  // Italian video
  audioPath: string;
  audioPath_it?: string;  // Italian audio
  thumbnailPath: string;
  thumbnailPath_it?: string;  // Italian thumbnail
  duration?: string;
  credits?: number;
  isFree?: boolean;
}

interface Series {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  episodes: Episode[];
  createdAt: string;
}

interface UniversalPlayerProps {
  initialEpisode: Episode;
  series: Series;
  isUnlocked: boolean;
  onUnlockRequired?: (episode: Episode) => void;
}

export default function UniversalPlayer({
  initialEpisode,
  series,
  isUnlocked,
  onUnlockRequired
}: UniversalPlayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { customer } = useFirebaseCustomerAuth();
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [mediaMode, setMediaMode] = useState<'video' | 'audio'>('audio');
  const [isLoading, setIsLoading] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [episodeUnlockStatus, setEpisodeUnlockStatus] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<string>('en');
  const [hideLanguageSelector, setHideLanguageSelector] = useState(false);
  const episodeListRef = useRef<HTMLDivElement>(null);
  const currentPlayerRef = useRef<any>(null);
  
  // Add cache busting to media URLs - memoized to prevent constant re-renders
  const addCacheBuster = useCallback((url: string) => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}&v=${refreshKey}`;
  }, [refreshKey]);

  // Helper function to get translated title
  const getTranslatedTitle = (episode: Episode) => {
    if (language === 'it' && episode.title_it) {
      return episode.title_it;
    }
    return episode.title;
  };

  // Helper function to get translated description
  const getTranslatedDescription = (episode: Episode) => {
    if (language === 'it' && episode.description_it) {
      return episode.description_it;
    }
    return episode.description;
  };

  // Helper function to get language-specific audio path
  const getAudioPath = (episode: Episode) => {
    if (language === 'it' && episode.audioPath_it) {
      return episode.audioPath_it;
    }
    return episode.audioPath;
  };

  // Helper function to get language-specific video path
  const getVideoPath = (episode: Episode) => {
    if (language === 'it' && episode.videoPath_it) {
      return episode.videoPath_it;
    }
    return episode.videoPath;
  };

  // Helper function to get language-specific thumbnail path
  const getThumbnailPath = (episode: Episode) => {
    if (language === 'it' && episode.thumbnailPath_it) {
      return episode.thumbnailPath_it;
    }
    return episode.thumbnailPath;
  };

  // Get available languages for current series
  const getAvailableLanguages = () => {
    const languages = ['en']; // English is always available
    
    // Check if any episode has Italian translation (text or media)
    const hasItalian = series.episodes.some(ep => 
      ep.title_it || ep.description_it || ep.audioPath_it || ep.videoPath_it
    );
    if (hasItalian) {
      languages.push('it');
    }
    
    return languages;
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };
  
  // Force refresh media
  const handleRefreshMedia = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 500);
  };
  
  // Debug logging for episode data
  useEffect(() => {
    // Current episode changed - logging removed for production
  }, [currentEpisode]);

  // Check available media and set initial mode
  useEffect(() => {
    // Validate episode data
    const hasVideo = currentEpisode.videoPath && currentEpisode.videoPath.trim() !== '';
    const hasAudio = currentEpisode.audioPath && currentEpisode.audioPath.trim() !== '';
    
    // Check episode media availability
    
    // If both are available, default to audio (temporary preference)
    if (hasVideo && hasAudio) {
      setMediaMode('audio');
    }
    // If only audio is available, force audio mode
    else if (!hasVideo && hasAudio) {
      setMediaMode('audio');
    }
    // If only video is available, force video mode
    else if (hasVideo && !hasAudio) {
      setMediaMode('video');
    }
    // If neither available, default to audio mode (will show error)
    else if (!hasVideo && !hasAudio) {
      console.error('Episode has no media files!');
      setMediaMode('audio');
    }
  }, [currentEpisode.episodeId, currentEpisode.videoPath, currentEpisode.audioPath]);

  // Load saved media mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem(`mediaMode-${currentEpisode.episodeId}`);
    if (savedMode === 'audio' || savedMode === 'video') {
      setMediaMode(savedMode);
    } else {
      // No saved preference, check if we should default to audio
      const hasVideo = currentEpisode.videoPath && currentEpisode.videoPath.trim() !== '';
      const hasAudio = currentEpisode.audioPath && currentEpisode.audioPath.trim() !== '';
      
      // Default to audio if available
      if (hasAudio) {
        setMediaMode('audio');
      }
    }
  }, [currentEpisode.episodeId, currentEpisode.videoPath, currentEpisode.audioPath]);

  // Load saved language preference and handle URL params
  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const hideSelector = urlParams.get('hideLangSelector');
    
    // Hide language selector if requested
    if (hideSelector === 'true') {
      setHideLanguageSelector(true);
    }
    
    if (langParam && (langParam === 'en' || langParam === 'it')) {
      setLanguage(langParam);
      localStorage.setItem('preferredLanguage', langParam);
      return; // URL param takes priority
    }
    
    // Check saved preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
      return;
    }
    
    // Auto-detect Italian visitors (only if no preference saved)
    try {
      // Check browser language
      const browserLang = navigator.language || (navigator as any).userLanguage || '';
      console.log('Browser language detected:', browserLang);
      
      // Check for Italian language (it, it-IT, it-CH, etc.)
      if (browserLang.toLowerCase().includes('it')) {
        console.log('Italian language detected');
        // Only switch if Italian content exists
        const hasItalianContent = series.episodes.some(ep => 
          ep.title_it || ep.description_it || ep.audioPath_it || ep.videoPath_it
        );
        if (hasItalianContent) {
          console.log('Italian content available, switching to Italian');
          setLanguage('it');
          localStorage.setItem('preferredLanguage', 'it');
          return;
        } else {
          console.log('No Italian content available, staying in English');
        }
      }
      
      // Check timezone for Italy
      if (Intl && Intl.DateTimeFormat) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('Timezone detected:', timezone);
        
        // Check for Italian timezones
        if (timezone && (
          timezone.includes('Rome') || 
          timezone.includes('Milan') || 
          timezone === 'Europe/Rome' ||
          timezone.toLowerCase().includes('italy')
        )) {
          console.log('Italian timezone detected');
          // Only switch if Italian content exists
          const hasItalianContent = series.episodes.some(ep => 
            ep.title_it || ep.description_it || ep.audioPath_it || ep.videoPath_it
          );
          if (hasItalianContent) {
            console.log('Italian content available, switching to Italian');
            setLanguage('it');
            localStorage.setItem('preferredLanguage', 'it');
          } else {
            console.log('No Italian content available, staying in English');
          }
        }
      }
    } catch (error) {
      // Silently fail if detection doesn't work
      console.error('Language auto-detection error:', error);
    }
  }, []);

  // Sync isUnlocked prop with internal state for current episode
  useEffect(() => {
    if (isUnlocked && currentEpisode) {
      setEpisodeUnlockStatus(prev => ({
        ...prev,
        [currentEpisode.episodeId]: true
      }));
    }
  }, [isUnlocked, currentEpisode]);

  // Check unlock status for all episodes
  useEffect(() => {
    const checkEpisodesUnlockStatus = async () => {
      if (!customer) return;
      
      const token = localStorage.getItem('customerToken');
      if (!token) return;

      // First ensure customer document exists (for Google OAuth users)
      try {
        const fixResponse = await fetch('/api/customer/emergency-fix', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!fixResponse.ok) {
          console.error('Emergency fix failed:', await fixResponse.text());
        }
      } catch (error) {
        console.error('Failed to ensure customer document:', error);
        // Try the original endpoint as fallback
        try {
          await fetch('/api/customer/force-create', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }

      const unlockStatus: Record<string, boolean> = {};
      
      // Check each episode's unlock status
      for (const episode of series.episodes) {
        // Episode 1 or free episodes are always unlocked
        if (episode.episodeNumber === 1 || episode.isFree) {
          unlockStatus[episode.episodeId] = true;
        } else {
          try {
            const res = await fetch(`/api/customer/unlock-episode?seriesId=${series.id}&episodeNumber=${episode.episodeNumber}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (res.ok) {
              const data = await res.json();
              unlockStatus[episode.episodeId] = data.isUnlocked;
            } else {
              unlockStatus[episode.episodeId] = false;
            }
          } catch (error) {
            unlockStatus[episode.episodeId] = false;
          }
        }
      }
      
      setEpisodeUnlockStatus(unlockStatus);
    };

    checkEpisodesUnlockStatus();
  }, [customer, series]);

  // Save media mode preference
  const toggleMediaMode = () => {
    const newMode = mediaMode === 'video' ? 'audio' : 'video';
    // Switching media mode
    
    setIsLoading(true);
    
    // Small delay to ensure clean unmount
    setTimeout(() => {
      setMediaMode(newMode);
      localStorage.setItem(`mediaMode-${currentEpisode.episodeId}`, newMode);
      setRefreshKey(prev => prev + 1);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }, 50);
  };

  // Handle episode change without page refresh
  const handleEpisodeChange = useCallback(async (episodeId: string) => {
    const newEpisode = series.episodes.find(ep => ep.episodeId === episodeId);
    if (!newEpisode) return;
    
    // Check if episode is unlocked
    const isEpisodeUnlocked = episodeUnlockStatus[episodeId] || 
                              newEpisode.episodeNumber === 1 || 
                              newEpisode.isFree || 
                              false;
    
    if (!isEpisodeUnlocked) {
      // Episode is locked - redirect to the watch page where unlock UI is shown
      router.push(`/watch/uploaded/${series.id}/${newEpisode.episodeNumber}`);
      return;
    }
    
    // Changing episode

    // Stop any playing media before switching
    setIsLoading(true);
    
    // Pause any currently playing media
    try {
      // Try to pause video element if it exists
      const videoElement = document.querySelector('video');
      if (videoElement && !videoElement.paused) {
        videoElement.pause();
      }
      
      // Try to pause audio element if it exists
      const audioElement = document.querySelector('audio');
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
      }
    } catch (error) {
      // Error pausing media - non-critical
    }
    
    // Add longer delay to ensure proper cleanup
    setTimeout(() => {
      // Update URL without page refresh
      const newUrl = `/watch/uploaded/${series.id}/${newEpisode.episodeNumber}`;
      window.history.pushState({}, '', newUrl);
      
      // Update current episode - force new object to ensure re-render
      setCurrentEpisode({ ...newEpisode });
      
      // Reset playback
      setCurrentTime(0);
      
      // Force refresh key to ensure player re-renders
      setRefreshKey(prev => prev + 1);
      
      setTimeout(() => {
        setIsLoading(false);
        // Scroll to current episode in the list
        const currentEpisodeElement = document.getElementById(`episode-${newEpisode.episodeId}`);
        if (currentEpisodeElement && episodeListRef.current) {
          currentEpisodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }, 150);
  }, [series, episodeUnlockStatus, router]);

  // Find adjacent episodes
  const currentIndex = series.episodes.findIndex(ep => ep.episodeId === currentEpisode.episodeId);
  const previousEpisode = currentIndex > 0 ? series.episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < series.episodes.length - 1 ? series.episodes[currentIndex + 1] : null;

  // Handle auto-advance to next episode
  const handleAudioEnded = useCallback(() => {
    if (nextEpisode) {
      handleEpisodeChange(nextEpisode.episodeId);
    }
  }, [nextEpisode, handleEpisodeChange]);
  
  // Memoize navigation callbacks
  const handlePrevious = useCallback(() => {
    if (previousEpisode) {
      handleEpisodeChange(previousEpisode.episodeId);
    }
  }, [previousEpisode, handleEpisodeChange]);
  
  const handleNext = useCallback(() => {
    if (nextEpisode) {
      handleEpisodeChange(nextEpisode.episodeId);
    }
  }, [nextEpisode, handleEpisodeChange]);

  return (
    <div className="relative">
      {/* Series Info Card */}
      <div className="mb-6 bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{series.title}</h1>
        <p className="text-gray-400 mb-3">{series.description}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-500 font-semibold">Episode {currentEpisode.episodeNumber}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-300">{currentEpisode.title}</span>
        </div>
        {currentEpisode.description && (
          <p className="text-sm text-gray-400 mt-2">{currentEpisode.description}</p>
        )}
      </div>
      
      {/* Player Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-gray-900 rounded-t-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Now Playing: Episode {currentEpisode.episodeNumber}</span>
        </div>
        
        <div className="flex items-center gap-2 justify-end">
          {/* Language Selector - only show if not hidden */}
          {!hideLanguageSelector && (
            <LanguageSelector
              availableLanguages={getAvailableLanguages()}
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          )}
          
          {/* Refresh Button */}
          <button
            onClick={handleRefreshMedia}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh media"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Mode Toggle or Mode Indicator */}
          {(() => {
            const hasVideo = currentEpisode.videoPath && currentEpisode.videoPath.trim() !== '';
            const hasAudio = currentEpisode.audioPath && currentEpisode.audioPath.trim() !== '';
            
            if (hasVideo && hasAudio) {
              // Show toggle when both formats available
              return (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => {
                      if (mediaMode !== 'video') {
                        toggleMediaMode();
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                      mediaMode === 'video'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    Video
                  </button>
                  <button
                    onClick={() => {
                      if (mediaMode !== 'audio') {
                        toggleMediaMode();
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                      mediaMode === 'audio'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Audio
                  </button>
                </div>
              );
            } else if (hasVideo || hasAudio) {
              // Show mode indicator when only one format available
              return (
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                  {hasVideo ? (
                    <>
                      <Film className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Video Only</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Audio Only</span>
                    </>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Loading State and Player */}
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center"
          >
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={`player-${mediaMode}-${refreshKey}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Player Content */}
            {(() => {
              // Check if current episode is unlocked
              const isCurrentEpisodeUnlocked = isUnlocked || 
                                                episodeUnlockStatus[currentEpisode.episodeId] || 
                                                currentEpisode.episodeNumber === 1 || 
                                                currentEpisode.isFree || 
                                                false;
              
              // If episode is locked, show lock screen
              if (!isCurrentEpisodeUnlocked) {
                return (
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Episode Locked</h3>
                      <p className="text-gray-400 mb-4">
                        {currentEpisode.credits || 30} credits required to unlock this episode
                      </p>
                      <button
                        onClick={() => router.push(`/watch/uploaded/${series.id}/${currentEpisode.episodeNumber}`)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
                      >
                        Go to Unlock Page
                      </button>
                    </div>
                  </div>
                );
              }
              
              const hasVideo = currentEpisode.videoPath && currentEpisode.videoPath.trim() !== '';
              const hasAudio = currentEpisode.audioPath && currentEpisode.audioPath.trim() !== '';
              
              // Ensure we only render one player at a time
              if (mediaMode === 'video' && hasVideo && !isLoading) {
                // Create episode with cache-busted URLs
                const episodeWithCacheBust = {
                  ...currentEpisode,
                  videoPath: addCacheBuster(currentEpisode.videoPath),
                  audioPath: currentEpisode.audioPath ? addCacheBuster(currentEpisode.audioPath) : '',
                  thumbnailPath: currentEpisode.thumbnailPath ? addCacheBuster(currentEpisode.thumbnailPath) : ''
                };
                // Update series with current episode to ensure sync
                const updatedSeries = {
                  ...series,
                  episodes: series.episodes.map(ep => 
                    ep.episodeId === currentEpisode.episodeId 
                      ? { ...ep, ...episodeWithCacheBust }
                      : ep
                  )
                };
                return (
                  <EnhancedVideoPlayer
                    episode={episodeWithCacheBust}
                    series={updatedSeries}
                    onEpisodeChange={handleEpisodeChange}
                  />
                );
              } else if (mediaMode === 'audio' && hasAudio) {
                return (
                  <EnhancedAudioPlayer
                    key={`audio-${currentEpisode.episodeId}`}
                    audioPath={getAudioPath(currentEpisode)}
                    thumbnailPath={getThumbnailPath(currentEpisode)}
                    title={getTranslatedTitle(currentEpisode)}
                    episodeNumber={currentEpisode.episodeNumber}
                    onTimeUpdate={setCurrentTime}
                    onEnded={handleAudioEnded}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    hasPrevious={!!previousEpisode}
                    hasNext={!!nextEpisode}
                  />
                );
              } else if (hasAudio && !hasVideo) {
                // Force audio player if only audio available
                return (
                  <EnhancedAudioPlayer
                    key={`audio-only-${currentEpisode.episodeId}`}
                    audioPath={getAudioPath(currentEpisode)}
                    thumbnailPath={getThumbnailPath(currentEpisode)}
                    title={getTranslatedTitle(currentEpisode)}
                    episodeNumber={currentEpisode.episodeNumber}
                    onTimeUpdate={setCurrentTime}
                    onEnded={handleAudioEnded}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    hasPrevious={!!previousEpisode}
                    hasNext={!!nextEpisode}
                  />
                );
              } else {
                // No media available
                return (
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Volume2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No media available for this episode</p>
                    </div>
                  </div>
                );
              }
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Rating - Only show when episode is unlocked */}
      {(isUnlocked || currentEpisode.episodeNumber === 1 || currentEpisode.isFree) && (
        <div className="mt-6">
          <EpisodeRating
            key={`rating-${currentEpisode.episodeId}`}
            seriesId={series.id}
            episodeId={currentEpisode.episodeId}
            episodeNumber={currentEpisode.episodeNumber}
          />
        </div>
      )}

      {/* Episode List - Always Visible */}
      <div className="mt-6 bg-gray-900 rounded-lg p-4" key={`episode-list-${currentEpisode.episodeId}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Episodes</h3>
          <button
            onClick={() => setShowEpisodeList(!showEpisodeList)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showEpisodeList ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        
        <AnimatePresence>
          {showEpisodeList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden relative"
            >
              <div 
                ref={episodeListRef} 
                className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide"
              >
                {series.episodes.map((episode) => {
                  const isCurrentEpisode = episode.episodeId === currentEpisode.episodeId;
                  const isEpisodeUnlocked = episodeUnlockStatus[episode.episodeId] || 
                                           episode.episodeNumber === 1 || 
                                           episode.isFree || 
                                           false;
                  const episodeCredits = episode.isFree || episode.episodeNumber === 1 ? 0 : (episode.credits || 30);
                  
                  return (
                    <motion.button
                      id={`episode-${episode.episodeId}`}
                      key={episode.episodeId}
                      onClick={() => handleEpisodeChange(episode.episodeId)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isCurrentEpisode
                          ? 'bg-red-600/20 border border-red-600'
                          : isEpisodeUnlocked
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      animate={isCurrentEpisode ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {!isEpisodeUnlocked && <Lock className="w-4 h-4 text-gray-500" />}
                          <p className={`font-medium ${!isEpisodeUnlocked ? 'text-gray-400' : ''}`}>
                            Episode {episode.episodeNumber}: {getTranslatedTitle(episode)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {episode.duration && (
                            <p className="text-sm text-gray-400">{episode.duration}</p>
                          )}
                          {!isEpisodeUnlocked && episodeCredits > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-500">
                              <Coins className="w-3 h-3" />
                              <span>{episodeCredits} credits</span>
                            </div>
                          )}
                          {episodeCredits === 0 && (
                            <span className="text-xs text-green-500">Free</span>
                          )}
                        </div>
                      </div>
                      {isCurrentEpisode && isEpisodeUnlocked && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                          <span className="text-xs text-red-600">Now Playing</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}