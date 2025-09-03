'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Gamepad2,
  PlayCircle,
  GitBranch,
  Users,
  Star,
  Lock,
  ChevronRight
} from 'lucide-react';
import { InteractiveSeries, InteractiveEpisode } from '@/types/interactive';

export default function InteractiveBrowsePage() {
  const router = useRouter();
  const [series, setSeries] = useState<InteractiveSeries[]>([]);
  const [episodes, setEpisodes] = useState<{ [key: string]: InteractiveEpisode[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  useEffect(() => {
    fetchInteractiveSeries();
  }, []);

  const fetchInteractiveSeries = async () => {
    try {
      const response = await fetch('/api/interactive-series');
      const data = await response.json();
      if (data.success) {
        // Only show active series
        const activeSeries = data.series.filter((s: InteractiveSeries) => s.isActive);
        setSeries(activeSeries);
        
        // Fetch episodes for each series
        for (const s of activeSeries) {
          fetchEpisodesForSeries(s.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch interactive series:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodesForSeries = async (seriesId: string) => {
    try {
      const response = await fetch(`/api/interactive-series/${seriesId}/episodes`);
      const data = await response.json();
      if (data.success) {
        // Only show published episodes
        const publishedEpisodes = data.episodes.filter((ep: InteractiveEpisode) => ep.isPublished);
        setEpisodes(prev => ({ ...prev, [seriesId]: publishedEpisodes }));
      }
    } catch (error) {
      console.error(`Failed to fetch episodes for series ${seriesId}:`, error);
    }
  };

  const handlePlayEpisode = (seriesId: string, episodeId: string) => {
    router.push(`/interactive/${seriesId}/${episodeId}/play`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white">
      {/* Header */}
      <header className="border-b border-purple-900/30 backdrop-blur bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <div className="text-center">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                <Gamepad2 className="w-8 h-8 text-purple-500" />
                Interactive Stories
              </h1>
              <p className="text-gray-400 mt-2">Choose Your Own Adventure</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {series.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No interactive stories available yet</p>
            <p className="text-sm text-gray-500 mt-2">Check back soon for exciting adventures!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <div
                key={s.id}
                className="bg-black/50 backdrop-blur rounded-xl overflow-hidden border border-purple-900/30 hover:border-purple-600/50 transition-all hover:scale-[1.02]"
              >
                {/* Series Thumbnail */}
                {s.thumbnailUrl && (
                  <div className="aspect-video relative">
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    {s.isPremium && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-600 to-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        PREMIUM
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{s.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {s.stats?.uniquePlayers || 0} players
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {s.stats?.totalPaths || 0} paths
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {s.creditCost} credits/episode
                    </span>
                  </div>

                  {/* Tags */}
                  {s.tags && s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {s.tags.map((tag, index) => (
                        <span key={index} className="bg-purple-900/30 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Episodes */}
                  {episodes[s.id] && episodes[s.id].length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-semibold mb-2">Available Episodes:</p>
                      {episodes[s.id].map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => handlePlayEpisode(s.id, ep.id)}
                          className="w-full p-3 bg-purple-900/20 hover:bg-purple-900/30 rounded-lg text-left flex items-center gap-3 transition-all"
                        >
                          <PlayCircle className="w-4 h-4 text-purple-400" />
                          <span className="flex-1 text-sm">
                            Ep {ep.episodeNumber}: {ep.title}
                          </span>
                          {ep.creditCost > 0 && (
                            <span className="text-xs text-gray-500">
                              {ep.creditCost} credits
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-purple-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-purple-900/30 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>🎮 Interactive stories where your choices shape the narrative</p>
          <p className="mt-2">Use headphones for the best experience</p>
        </div>
      </footer>
    </div>
  );
}