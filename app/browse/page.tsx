'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronDown, Clock, Lock, Film, Sparkles, Heart } from 'lucide-react';
import CustomerHeader from '@/components/CustomerHeader';
import PremiumLogo from '@/components/PremiumLogo';
import ProxiedImage from '@/components/ProxiedImage';
import MobileNav from '@/components/MobileNav';
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
  }, []);

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
            <div className="flex items-center space-x-8">
              <PremiumLogo size="md" />
              <div className="flex items-center space-x-6">
                <span className="text-white font-semibold font-poppins">Browse</span>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/favorites" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
              </div>
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="pt-16">
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
          <div className="space-y-8 pb-20">
            {series.map((s, index) => (
              <div key={s.id} className="relative">
                  {/* Hero Banner Section */}
                  <div 
                    className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-[1.02]"
                    onClick={() => toggleSeriesExpansion(s.id)}
                    onMouseEnter={() => setHoveredSeries(s.id)}
                    onMouseLeave={() => setHoveredSeries(null)}
                  >
                    {/* Banner Image with Ken Burns effect */}
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-end pb-12 px-4 sm:px-6 lg:px-8">
                      <div className="max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-4 drop-shadow-lg">
                          {s.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 line-clamp-3 drop-shadow-md">
                          {s.description}
                        </p>
                        
                        {/* Series Metadata */}
                        <div className="flex items-center gap-4 text-sm sm:text-base mb-6">
                          <span className="text-green-500 font-semibold flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            New
                          </span>
                          <span>{s.episodes.length} Episodes</span>
                          <span>{getSeriesDuration(s.episodes)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <div className="transform transition-transform duration-200 hover:scale-105 active:scale-95">
                            <Link
                              href={`/watch/uploaded/${s.id}/1`}
                              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Play className="w-5 h-5" fill="currentColor" />
                              Play
                            </Link>
                          </div>
                          <button 
                            className="flex items-center gap-2 px-6 py-3 bg-gray-700/80 hover:bg-gray-600/80 rounded transition-all duration-200 backdrop-blur-sm transform hover:scale-105 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSeriesExpansion(s.id);
                            }}
                          >
                            <Info className="w-5 h-5" />
                            More Info
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Indicator */}
                    <div 
                      className={`absolute bottom-4 right-4 sm:right-8 transition-all duration-300 ${
                        hoveredSeries === s.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full">
                        <span className="text-sm">View Episodes</span>
                        <div
                          className={`transition-transform duration-300 ${
                            expandedSeries === s.id ? 'rotate-180' : ''
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Episode List */}
                  {expandedSeries === s.id && (
                    <div className="overflow-hidden">
                        <div className="bg-gray-950 px-4 sm:px-6 lg:px-8 py-8">
                          <h2 className="text-2xl font-semibold font-poppins mb-6">Episodes</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                            {s.episodes.map((episode, i) => (
                              <div
                                key={episode.episodeId}
                                className="group h-full transform transition-transform duration-200 hover:scale-105"
                              >
                                <Link
                                  href={`/watch/uploaded/${s.id}/${episode.episodeNumber}`}
                                  className="block h-full"
                                >
                                  <div className="bg-gray-900 rounded-lg overflow-hidden h-full flex flex-col">
                                    {/* Episode Thumbnail */}
                                    <div className="relative aspect-video bg-gray-800">
                                      {episode.thumbnailPath ? (
                                        <>
                                          {imageLoading[episode.episodeId] !== false && (
                                            <div className="absolute inset-0">
                                              <LoadingShimmer />
                                            </div>
                                          )}
                                          <ProxiedImage
                                            src={episode.thumbnailPath} 
                                            alt={episode.title}
                                            className="w-full h-full object-cover"
                                            onLoad={() => setImageLoading(prev => ({ ...prev, [episode.episodeId]: false }))}
                                            onError={() => setImageLoading(prev => ({ ...prev, [episode.episodeId]: false }))}
                                          />
                                        </>
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Film className="w-12 h-12 text-gray-600" />
                                        </div>
                                      )}
                                      
                                      {/* Play overlay */}
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="bg-white rounded-full p-3 transform transition-transform duration-200 hover:scale-110">
                                          <Play className="w-6 h-6 text-black" fill="currentColor" />
                                        </div>
                                      </div>

                                      {/* Episode number badge */}
                                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                                        Episode {episode.episodeNumber}
                                      </div>

                                      {/* Duration */}
                                      {episode.duration && (
                                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {episode.duration}
                                        </div>
                                      )}
                                    </div>

                                    {/* Episode Info - Fixed height with flex-grow */}
                                    <div className="p-4 flex flex-col flex-grow">
                                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-red-500 transition-colors min-h-[2.5rem]">
                                        {episode.title}
                                      </h3>
                                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-grow min-h-[2rem]">
                                        {episode.description || 'No description available'}
                                      </p>
                                      
                                      {/* Price/Free indicator - Always at bottom */}
                                      <div className="flex items-center justify-between text-xs mt-auto">
                                        {episode.isFree || episode.episodeNumber === 1 ? (
                                          <span className="text-green-500 font-semibold">
                                            Free
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-1 text-yellow-500">
                                            <Lock className="w-3 h-3" />
                                            <span className="font-semibold">{episode.credits || 50} credits</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}