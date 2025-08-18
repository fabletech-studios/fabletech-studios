'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronDown, Clock, Lock, Film, Sparkles, Heart, ChevronRight, Eye, Star } from 'lucide-react';
import CustomerHeader from '@/components/CustomerHeader';
import PremiumLogo from '@/components/PremiumLogo';
import ProxiedImage from '@/components/ProxiedImage';
import MobileNav from '@/components/MobileNav';
import MainNavigation from '@/components/MainNavigation';
import './browse.css';

interface Episode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  videoPath: string;
  audioPath: string;
  thumbnailPath: string;
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

// Loading shimmer component - simplified for performance
const LoadingShimmer = () => (
  <div className="bg-gray-800 rounded-lg animate-pulse" />
);

export default function BrowsePage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.series) {
          setSeries(data.series);
          if (data.series.length === 1) {
            setExpandedSeries(data.series[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load content:', err))
      .finally(() => setLoading(false));
      
    // Load favorites from localStorage
    const storedFavorites = localStorage.getItem('episodeFavorites');
    if (storedFavorites) {
      setFavorites(new Set(JSON.parse(storedFavorites)));
    }
  }, []);
  
  const toggleFavorite = (episodeId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(episodeId)) {
        newFavorites.delete(episodeId);
      } else {
        newFavorites.add(episodeId);
      }
      localStorage.setItem('episodeFavorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const toggleSeriesExpansion = (seriesId: string) => {
    setExpandedSeries(expandedSeries === seriesId ? null : seriesId);
  };

  const getSeriesDuration = (episodes: Episode[]) => {
    const totalSeconds = episodes.reduce((acc, ep) => {
      if (!ep.duration) return acc;
      const parts = ep.duration.split(':').map(Number);
      if (parts.length === 2) {
        // Format is M:SS (minutes:seconds)
        return acc + parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        // Format is H:MM:SS (hours:minutes:seconds)
        return acc + parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return acc;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const bannerVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  };

  const episodeCardVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 w-full bg-gradient-to-b from-black via-black/95 to-transparent z-50 transition-all duration-300">
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 lg:gap-8">
              <PremiumLogo size="md" />
              <MainNavigation />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="pt-28 md:pt-16">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">Loading your content...</p>
            </div>
          </div>
        ) : series.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="text-center">
              <Film className="w-20 h-20 text-gray-700 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold font-poppins mb-2">No series available yet</h2>
              <p className="text-gray-400">Check back soon for new content!</p>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {/* Series Grid with Better Separation */}
            {series.map((s, index) => (
              <div key={s.id} className="relative">
                {/* Separator between series */}
                {index > 0 && (
                  <div className="h-24 bg-gradient-to-b from-transparent via-gray-900/20 to-transparent relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full max-w-4xl mx-auto px-8">
                        <div className="border-t border-gray-800/50"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Series Container with Clear Boundaries */}
                <div className="relative bg-gradient-to-b from-black via-gray-950 to-black">
                  {/* Hero Banner Section with Enhanced Styling */}
                  <div 
                    className="relative h-[45vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] overflow-hidden cursor-pointer group"
                    onClick={() => toggleSeriesExpansion(s.id)}
                    onMouseEnter={() => setHoveredSeries(s.id)}
                    onMouseLeave={() => setHoveredSeries(null)}
                  >
                    {/* Enhanced Image Container */}
                    <div className="absolute inset-0 transform transition-transform duration-700 group-hover:scale-105">
                      {s.bannerUrl ? (
                        <>
                          {imageLoading[s.id] !== false && (
                            <div className="absolute inset-0">
                              <LoadingShimmer />
                            </div>
                          )}
                          <ProxiedImage
                            src={s.bannerUrl} 
                            alt={s.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onLoad={() => setImageLoading(prev => ({ ...prev, [s.id]: false }))}
                            onError={() => setImageLoading(prev => ({ ...prev, [s.id]: false }))}
                          />
                          {/* Enhanced Gradient Overlays */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-gray-900 to-black">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        </div>
                      )}
                    </div>

                    {/* Content Overlay with Better Positioning */}
                    <div className="absolute inset-0 flex items-end pb-16 px-6 sm:px-8 lg:px-12">
                      <div className="max-w-3xl">
                        {/* Series Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 backdrop-blur-sm border border-red-600/30 rounded-full mb-4">
                          <Film className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-semibold text-red-400">SERIES</span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-poppins mb-4 drop-shadow-2xl">
                          {s.title}
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 line-clamp-2 drop-shadow-lg max-w-2xl">
                          {s.description}
                        </p>
                        
                        {/* Enhanced Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base mb-8">
                          <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full">
                            <Sparkles className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-semibold">New Series</span>
                          </span>
                          <span className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                            <Eye className="w-4 h-4" />
                            {s.episodes.length} Episodes
                          </span>
                          <span className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                            <Clock className="w-4 h-4" />
                            {getSeriesDuration(s.episodes)}
                          </span>
                          <span className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 backdrop-blur-sm rounded-full">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400">New Series</span>
                          </span>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4">
                          <Link
                            href={`/watch/uploaded/${s.id}/1`}
                            className="group/btn flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play className="w-6 h-6" fill="currentColor" />
                            <span className="text-lg">Play Series</span>
                          </Link>
                          
                          <button 
                            className="group/btn flex items-center gap-3 px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg transition-all transform hover:scale-105 border border-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSeriesExpansion(s.id);
                            }}
                          >
                            <Info className="w-6 h-6" />
                            <span className="text-lg">Episodes</span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${
                              expandedSeries === s.id ? 'rotate-180' : ''
                            }`} />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(s.id);
                            }}
                            className="p-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg transition-all transform hover:scale-105 border border-gray-700"
                          >
                            <Heart className={`w-6 h-6 ${favorites.has(s.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hover Indicator */}
                    <div 
                      className={`absolute bottom-8 right-8 transition-all duration-300 ${
                        hoveredSeries === s.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <span className="text-sm font-medium">Browse Episodes</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Episode List Section */}
                  {expandedSeries === s.id && (
                    <div className="bg-gradient-to-b from-gray-950 to-black px-6 sm:px-8 lg:px-12 py-12">
                      <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                          <Film className="w-6 h-6 text-red-500" />
                          Episodes
                          <span className="text-sm font-normal text-gray-400">({s.episodes.length} available)</span>
                        </h2>
                        
                        <div className="grid gap-4">
                          {s.episodes.map((episode, i) => (
                            <Link
                              key={episode.episodeId}
                              href={`/watch/uploaded/${s.id}/${episode.episodeNumber}`}
                              className="group"
                            >
                              <div className="flex items-center gap-6 p-6 bg-gray-900/50 hover:bg-gray-800/70 rounded-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 transform hover:scale-[1.02]">
                                {/* Episode Thumbnail */}
                                <div className="flex-shrink-0 w-24 h-16 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg overflow-hidden relative group">
                                  {episode.thumbnailPath ? (
                                    <ProxiedImage
                                      src={episode.thumbnailPath}
                                      alt={episode.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-2xl font-bold text-white/80">{episode.episodeNumber}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white" fill="currentColor" />
                                  </div>
                                  <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-xs font-bold">
                                    EP{episode.episodeNumber}
                                  </div>
                                </div>
                                
                                {/* Episode Info */}
                                <div className="flex-grow">
                                  <h3 className="text-lg font-semibold mb-1 group-hover:text-red-400 transition-colors">
                                    {episode.title}
                                  </h3>
                                  {episode.description && (
                                    <p className="text-gray-400 text-sm line-clamp-2">
                                      {episode.description}
                                    </p>
                                  )}
                                  
                                  {/* Episode Metadata */}
                                  <div className="flex items-center gap-4 mt-3">
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      {episode.duration || '10:00'}
                                    </span>
                                    {episode.isFree ? (
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold">
                                        FREE
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                        <Lock className="w-3 h-3" />
                                        {episode.credits || 5} credits
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFavorite(episode.episodeId);
                                    }}
                                    className="p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg transition-all"
                                    title="Add to favorites"
                                  >
                                    <Heart className={`w-5 h-5 ${favorites.has(episode.episodeId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                  </button>
                                  <div className="w-12 h-12 bg-white/10 group-hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-110">
                                    <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}