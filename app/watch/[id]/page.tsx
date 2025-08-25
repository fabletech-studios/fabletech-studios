'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, Lock, Coins, Shield } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import CopyrightNotice from '@/components/CopyrightNotice';
import CustomerHeader from '@/components/CustomerHeader';
import MainNavigation from '@/components/MainNavigation';
import PremiumLogo from '@/components/PremiumLogo';

// Use the new EnhancedPlayer for better functionality
const EnhancedPlayer = dynamic(() => import('@/components/video/EnhancedPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  duration: string;
  credits: number;
  isFree: boolean;
  seriesTitle: string;
  episodeNumber: number;
  nextEpisodeId?: string;
  previousEpisodeId?: string;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const notify = useNotifications();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userCredits, setUserCredits] = useState(100); // Mock user credits
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [showCopyrightAgreement, setShowCopyrightAgreement] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Try to get user ID from localStorage or cookie
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }

    // Check if user has accepted copyright agreement
    const hasAcceptedCopyright = localStorage.getItem('copyright_accepted');
    if (!hasAcceptedCopyright && isUnlocked) {
      setShowCopyrightAgreement(true);
    }

    // Mock data - replace with API call
    const mockEpisode: Episode = {
      id,
      title: 'Chapter 1: The Beginning',
      description: 'An epic journey begins as our hero discovers their true destiny...',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      thumbnailUrl: '/api/placeholder/1280/720',
      duration: '45:00',
      credits: id === '1' ? 0 : 50,
      isFree: id === '1',
      seriesTitle: 'The Fable Chronicles',
      episodeNumber: parseInt(id),
      nextEpisodeId: String(parseInt(id) + 1),
      previousEpisodeId: parseInt(id) > 1 ? String(parseInt(id) - 1) : undefined,
    };

    setEpisode(mockEpisode);
    setIsUnlocked(mockEpisode.isFree || userCredits >= mockEpisode.credits);
  }, [id, userCredits]);

  const handleUnlock = () => {
    if (episode && userCredits >= episode.credits) {
      setUserCredits(userCredits - episode.credits);
      setIsUnlocked(true);
      notify.episodeUnlocked();
      notify.creditsDeducted(episode.credits);
    }
  };

  const handlePurchaseCredits = () => {
    // Mock purchase - in real app, integrate payment gateway
    setUserCredits(userCredits + 100);
    notify.creditsAdded(100);
  };

  if (!episode) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <PremiumLogo size="md" />
              <MainNavigation />
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
                <span>Now Playing:</span>
                <span className="text-white">{episode.seriesTitle}</span>
                <span>•</span>
                <span>Episode {episode.episodeNumber}</span>
              </div>
            </div>
            <CustomerHeader />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2">
            {isUnlocked ? (
              <div className="space-y-4">
                {/* Enhanced Player */}
                <EnhancedPlayer
                  episode={{
                    ...episode,
                    videoUrl: episode.videoUrl || '',
                    episodeNumber: parseInt(id),
                    seriesTitle: 'The Fable Chronicles',
                  }}
                  episodes={[
                    {
                      ...episode,
                      videoUrl: episode.videoUrl || '',
                      episodeNumber: parseInt(id),
                      seriesTitle: 'The Fable Chronicles',
                    }
                  ]}
                  onEpisodeChange={(episodeId) => {
                    // Navigate to the new episode
                    window.location.href = `/watch/${episodeId}`;
                  }}
                  autoplay={true}
                  onComplete={() => {
                    console.log('Episode completed');
                  }}
                />
              </div>
            ) : (
              /* Locked Content */
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Episode Locked</h3>
                  <p className="text-gray-400 mb-6">Unlock this episode for {episode.credits} credits</p>
                  
                  {userCredits >= episode.credits ? (
                    <button
                      onClick={handleUnlock}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2 mx-auto"
                    >
                      <Coins className="w-5 h-5" /> Unlock for {episode.credits} Credits
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-red-500">Insufficient credits ({userCredits}/{episode.credits})</p>
                      <button
                        onClick={handlePurchaseCredits}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold"
                      >
                        Buy More Credits
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">{episode.title}</h2>
              <p className="text-gray-400 mb-4">Duration: {episode.duration}</p>
              <p className="text-gray-300">{episode.description}</p>
            </div>

            {/* Series Episodes List */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">More Episodes</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Link
                    key={num}
                    href={`/watch/${num}`}
                    className={`block p-3 rounded-lg hover:bg-gray-800 transition ${
                      num === parseInt(id) ? 'bg-gray-800 border border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Episode {num}</p>
                        <p className="text-sm text-gray-400">
                          {num === 1 ? 'Free' : `${50} credits`}
                        </p>
                      </div>
                      {num > 1 && <Lock className="w-4 h-4 text-gray-600" />}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Copyright Agreement Modal */}
      {showCopyrightAgreement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full">
            <CopyrightNotice
              variant="full"
              onAccept={() => {
                localStorage.setItem('copyright_accepted', 'true');
                setShowCopyrightAgreement(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}