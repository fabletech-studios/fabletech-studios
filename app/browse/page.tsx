'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronDown, ChevronUp, Clock, Lock, Film, Sparkles } from 'lucide-react';
import CustomerHeader from '@/components/CustomerHeader';
import PremiumLogo from '@/components/PremiumLogo';
import { 
  kenBurns, 
  fadeInUp, 
  staggerContainer,
  cardHover,
  navAnimation,
  shimmer
} from '@/lib/animations';

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

// Loading shimmer component
const LoadingShimmer = () => (
  <div className="relative overflow-hidden bg-gray-800 rounded-lg">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent"
      variants={shimmer}
      initial="initial"
      animate="animate"
    />
  </div>
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
    <motion.div 
      className="min-h-screen bg-black text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Premium Header */}
      <motion.header 
        className="fixed top-0 w-full bg-gradient-to-b from-black via-black/95 to-transparent z-50 transition-all duration-300"
        variants={navAnimation}
        initial="initial"
        animate="animate"
      >
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <PremiumLogo size="md" />
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-white font-semibold font-poppins">Browse</span>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </div>
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </motion.header>

      <main className="pt-16">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
              <p className="text-gray-400 text-lg font-medium">Loading your content...</p>
            </motion.div>
          </div>
        ) : series.length === 0 ? (
          <motion.div 
            className="flex items-center justify-center min-h-screen px-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="text-center">
              <Film className="w-20 h-20 text-gray-700 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold font-poppins mb-2">No series available yet</h2>
              <p className="text-gray-400">Check back soon for new content!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-8 pb-20"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence>
              {series.map((s, index) => (
                <motion.div 
                  key={s.id} 
                  className="relative"
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                >
                  {/* Hero Banner Section with Ken Burns */}
                  <motion.div 
                    className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden cursor-pointer group"
                    onClick={() => toggleSeriesExpansion(s.id)}
                    onMouseEnter={() => setHoveredSeries(s.id)}
                    onMouseLeave={() => setHoveredSeries(null)}
                    variants={bannerVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Banner Image with Ken Burns effect */}
                    {s.bannerUrl ? (
                      <>
                        {imageLoading[s.id] !== false && (
                          <div className="absolute inset-0">
                            <LoadingShimmer />
                          </div>
                        )}
                        <motion.img 
                          src={s.bannerUrl} 
                          alt={s.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          variants={kenBurns}
                          initial="initial"
                          animate="animate"
                          onLoad={() => setImageLoading(prev => ({ ...prev, [s.id]: false }))}
                          onError={() => setImageLoading(prev => ({ ...prev, [s.id]: false }))}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      </>
                    ) : (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      </motion.div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-end pb-12 px-4 sm:px-6 lg:px-8">
                      <motion.div 
                        className="max-w-2xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-4 drop-shadow-lg">
                          {s.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 line-clamp-3 drop-shadow-md">
                          {s.description}
                        </p>
                        
                        {/* Series Metadata */}
                        <div className="flex items-center gap-4 text-sm sm:text-base mb-6">
                          <motion.span 
                            className="text-green-500 font-semibold flex items-center gap-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                          >
                            <Sparkles className="w-4 h-4" />
                            New
                          </motion.span>
                          <span>{s.episodes.length} Episodes</span>
                          <span>{getSeriesDuration(s.episodes)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                              href={`/watch/uploaded/${s.id}/1`}
                              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Play className="w-5 h-5" fill="currentColor" />
                              Play
                            </Link>
                          </motion.div>
                          <motion.button 
                            className="flex items-center gap-2 px-6 py-3 bg-gray-700/80 hover:bg-gray-600/80 rounded transition-colors backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSeriesExpansion(s.id);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Info className="w-5 h-5" />
                            More Info
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>

                    {/* Expand/Collapse Indicator */}
                    <motion.div 
                      className="absolute bottom-4 right-4 sm:right-8"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: hoveredSeries === s.id ? 1 : 0,
                        y: hoveredSeries === s.id ? 0 : 10
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full">
                        <span className="text-sm">View Episodes</span>
                        <motion.div
                          animate={{ rotate: expandedSeries === s.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Expandable Episode List with Cascade Animation */}
                  <AnimatePresence>
                    {expandedSeries === s.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-950 px-4 sm:px-6 lg:px-8 py-8">
                          <h2 className="text-2xl font-semibold font-poppins mb-6">Episodes</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                            {s.episodes.map((episode, i) => (
                              <motion.div
                                key={episode.episodeId}
                                custom={i}
                                variants={episodeCardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                className="group h-full"
                              >
                                <Link
                                  href={`/watch/uploaded/${s.id}/${episode.episodeNumber}`}
                                  className="block h-full"
                                >
                                  <motion.div 
                                    className="bg-gray-900 rounded-lg overflow-hidden h-full flex flex-col"
                                    variants={cardHover}
                                  >
                                    {/* Episode Thumbnail */}
                                    <div className="relative aspect-video bg-gray-800">
                                      {episode.thumbnailPath ? (
                                        <>
                                          {imageLoading[episode.episodeId] !== false && (
                                            <div className="absolute inset-0">
                                              <LoadingShimmer />
                                            </div>
                                          )}
                                          <img 
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
                                      <motion.div 
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <motion.div 
                                          className="bg-white rounded-full p-3"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <Play className="w-6 h-6 text-black" fill="currentColor" />
                                        </motion.div>
                                      </motion.div>

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
                                          <motion.span 
                                            className="text-green-500 font-semibold"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2 + i * 0.05 }}
                                          >
                                            Free
                                          </motion.span>
                                        ) : (
                                          <div className="flex items-center gap-1 text-yellow-500">
                                            <Lock className="w-3 h-3" />
                                            <span className="font-semibold">{episode.credits || 50} credits</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}