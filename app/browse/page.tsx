'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Clock, Film, Upload, Lock, Menu, X } from 'lucide-react';
import CustomerHeader from '@/components/CustomerHeader';

export default function BrowsePage() {
  const [uploadedContent, setUploadedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch uploaded content
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.series) {
          setUploadedContent(data.series);
        }
      })
      .catch(err => console.error('Failed to load content:', err))
      .finally(() => setLoading(false));
  }, []);

  // Get all episodes from uploaded content
  const getAllEpisodes = () => {
    const episodes: any[] = [];
    
    uploadedContent.forEach(series => {
      if (series.episodes && Array.isArray(series.episodes)) {
        series.episodes.forEach((episode: any) => {
          episodes.push({
            id: `${series.id}-${episode.episodeId}`,
            title: `${series.title} - Episode ${episode.episodeNumber}: ${episode.title}`,
            seriesTitle: series.title,
            type: 'video' as const,
            thumbnail: episode.thumbnailPath || '/placeholder.svg',
            duration: episode.duration || 'N/A',
            seriesId: series.id,
            episodeNumber: episode.episodeNumber,
            episodeData: episode,
            isUploaded: true
          });
        });
      }
    });
    
    return episodes;
  };

  const contentToDisplay = getAllEpisodes();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 sticky top-0 bg-black z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Link href="/" className="text-xl lg:text-2xl font-bold text-red-600 flex-shrink-0">
                <span className="hidden sm:inline">FableTech Studios</span>
                <span className="sm:hidden">FableTech</span>
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Desktop filters - hidden on mobile */}
              <div className="hidden lg:flex space-x-2">
                <span className="px-4 py-2 text-gray-400 text-sm">Browse All Content</span>
              </div>
            </div>

            {/* Desktop Customer Header */}
            <div className="hidden lg:block">
              <CustomerHeader />
            </div>

            {/* Mobile Customer Header - simplified */}
            <div className="lg:hidden">
              <CustomerHeader />
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-800 py-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-400 px-4 pb-2">Browse Content</div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-4 sm:mb-0">Browse Content</h1>
          <div className="text-sm text-gray-400">
            {contentToDisplay.length} episode{contentToDisplay.length !== 1 ? 's' : ''} available
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading content...</p>
          </div>
        ) : contentToDisplay.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-4">No content available yet</p>
            <p className="text-gray-500 mb-6">Check back soon for new episodes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {contentToDisplay.map((item) => (
              <Link
                key={item.id}
                href={`/watch/uploaded/${item.seriesId}/${item.episodeNumber}`}
                className="group relative bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
              >
                <div className="aspect-video bg-gray-800 relative">
                  {item.thumbnail && item.thumbnail !== '/placeholder.svg' ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <Play className="w-12 lg:w-16 h-12 lg:h-16 text-white" />
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-medium">
                    Episode {item.episodeNumber}
                  </div>
                </div>
                
                <div className="p-3 lg:p-4">
                  <div className="mb-1">
                    <p className="text-xs text-gray-400 truncate">{item.seriesTitle}</p>
                  </div>
                  <h3 className="font-semibold text-sm lg:text-base mb-2 line-clamp-2 leading-tight">
                    {item.episodeData?.title || `Episode ${item.episodeNumber}`}
                  </h3>
                  <div className="flex items-center justify-between text-xs lg:text-sm text-gray-400">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2">
                      {item.episodeData?.isFree || item.episodeData?.episodeNumber === 1 ? (
                        <span className="text-green-500 font-medium">Free</span>
                      ) : (
                        <>
                          <span className="font-medium">{item.episodeData?.credits || 30}</span>
                          <Lock className="w-3 h-3 lg:w-4 lg:h-4 text-gray-500" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}