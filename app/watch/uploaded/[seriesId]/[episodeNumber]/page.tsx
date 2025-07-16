'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, Lock, Coins, Film } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';
import { addUserActivity } from '@/lib/firebase/activity-service';

const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), {
  ssr: false,
});

interface Episode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  videoPath: string;
  audioPath: string;
  thumbnailPath: string;
  credits?: number;
  isFree?: boolean;
}

interface Series {
  id: string;
  title: string;
  description: string;
  episodes: Episode[];
  createdAt: string;
}

export default function WatchUploadedPage({ 
  params 
}: { 
  params: Promise<{ seriesId: string; episodeNumber: string }> 
}) {
  const { seriesId, episodeNumber } = use(params);
  const [series, setSeries] = useState<Series | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const { customer, updateCredits } = useFirebaseCustomerAuth();
  const router = useRouter();

  const [episodeCredits, setEpisodeCredits] = useState(0);

  useEffect(() => {
    // Fetch series data
    fetch(`/api/content/${seriesId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.series) {
          setSeries(data.series);
          const episode = data.series.episodes.find(
            (ep: Episode) => ep.episodeNumber === parseInt(episodeNumber)
          );
          setCurrentEpisode(episode || null);
          if (episode) {
            // Get credit requirement from episode data
            const creditReq = episode.isFree || episode.episodeNumber === 1 ? 0 : (episode.credits || 30);
            setEpisodeCredits(creditReq);
            // Check if unlocked - free episodes or check with API
            if (creditReq === 0) {
              setIsUnlocked(true);
            } else if (customer) {
              checkEpisodeUnlocked();
            }
          }
        }
      })
      .catch(err => console.error('Failed to load episode:', err))
      .finally(() => setLoading(false));
  }, [seriesId, episodeNumber, customer]);

  const checkEpisodeUnlocked = async () => {
    if (!customer) return;
    
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
      const res = await fetch(`/api/customer/unlock-episode?seriesId=${seriesId}&episodeNumber=${episodeNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsUnlocked(data.isUnlocked);
      }
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  };

  const handleUnlock = async () => {
    if (!customer) {
      router.push('/login');
      return;
    }

    if (customer.credits < episodeCredits) {
      alert('Insufficient credits. Please purchase more credits.');
      return;
    }

    setUnlocking(true);
    const token = localStorage.getItem('customerToken');
    
    try {
      const res = await fetch('/api/customer/unlock-episode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seriesId,
          episodeNumber: parseInt(episodeNumber),
          creditCost: episodeCredits
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setIsUnlocked(true);
        updateCredits(data.remainingCredits);
        if (!data.alreadyUnlocked) {
          alert(`Episode unlocked! You have ${data.remainingCredits} credits remaining.`);
        }
      } else {
        alert(data.error || 'Failed to unlock episode');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      alert('Failed to unlock episode. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const handlePurchaseCredits = () => {
    router.push('/credits/purchase');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!series || !currentEpisode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Episode not found</p>
          <Link href="/browse" className="text-red-600 hover:text-red-500">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const currentEpisodeIndex = series.episodes.findIndex(ep => ep.episodeNumber === parseInt(episodeNumber));
  const previousEpisode = currentEpisodeIndex > 0 ? series.episodes[currentEpisodeIndex - 1] : null;
  const nextEpisode = currentEpisodeIndex < series.episodes.length - 1 ? series.episodes[currentEpisodeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="hover:text-gray-300">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{series.title}</h1>
                <p className="text-sm text-gray-400">Episode {currentEpisode.episodeNumber}: {currentEpisode.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {customer ? (
                <>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">{customer.credits}</span>
                  </div>
                  <button
                    onClick={handlePurchaseCredits}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold"
                  >
                    Buy Credits
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2">
            {isUnlocked ? (
              <div className="space-y-4">
                {/* Media Type Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMediaType('video')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      mediaType === 'video' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    disabled={!currentEpisode.videoPath}
                  >
                    <Play className="w-4 h-4" /> Video
                  </button>
                  <button
                    onClick={() => setMediaType('audio')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      mediaType === 'audio' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    disabled={!currentEpisode.audioPath}
                  >
                    <Volume2 className="w-4 h-4" /> Audio Only
                  </button>
                </div>

                {/* Video/Audio Player */}
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {mediaType === 'video' && currentEpisode.videoPath ? (
                    <video
                      controls
                      className="w-full h-full"
                      poster={currentEpisode.thumbnailPath || undefined}
                      key={currentEpisode.videoPath}
                    >
                      <source src={currentEpisode.videoPath} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8">
                      {currentEpisode.thumbnailPath ? (
                        <img
                          src={currentEpisode.thumbnailPath}
                          alt={currentEpisode.title}
                          className="w-48 h-48 rounded-lg mb-8 object-cover"
                        />
                      ) : (
                        <Film className="w-48 h-48 text-gray-700 mb-8" />
                      )}
                      {currentEpisode.audioPath && (
                        <audio
                          controls
                          autoPlay={false}
                          className="w-full max-w-md"
                          src={currentEpisode.audioPath}
                          key={currentEpisode.audioPath}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  )}
                </div>

                {/* Episode Navigation */}
                <div className="flex justify-between items-center">
                  {previousEpisode ? (
                    <Link
                      href={`/watch/uploaded/${seriesId}/${previousEpisode.episodeNumber}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      <SkipBack className="w-4 h-4" /> Previous
                    </Link>
                  ) : (
                    <div />
                  )}
                  
                  {nextEpisode && (
                    <Link
                      href={`/watch/uploaded/${seriesId}/${nextEpisode.episodeNumber}`}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Next <SkipForward className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              /* Locked Content */
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Episode Locked</h3>
                  <p className="text-gray-400 mb-6">{episodeCredits} credits required to unlock this episode</p>
                  
                  {!customer ? (
                    <Link
                      href="/login"
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold inline-block"
                    >
                      Sign In to Unlock
                    </Link>
                  ) : customer.credits >= episodeCredits ? (
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-semibold flex items-center gap-2 mx-auto"
                    >
                      <Coins className="w-5 h-5" /> 
                      {unlocking ? 'Unlocking...' : `Unlock for ${episodeCredits} Credits`}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-red-500">Insufficient credits ({customer.credits}/{episodeCredits})</p>
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

          {/* Series & Episode Info */}
          <div className="space-y-6">
            {/* Series Info */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">{series.title}</h2>
              <p className="text-gray-400 mb-4">Series Overview</p>
              <p className="text-gray-300">{series.description}</p>
            </div>

            {/* Current Episode Info */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Episode {currentEpisode.episodeNumber}: {currentEpisode.title}</h3>
              {currentEpisode.description && (
                <p className="text-gray-300 text-sm">{currentEpisode.description}</p>
              )}
              {!currentEpisode.description && (
                <p className="text-gray-500 text-sm italic">No episode description available</p>
              )}
            </div>

            {/* Series Episodes List */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">All Episodes</h3>
              <div className="space-y-3">
                {series.episodes.map((episode) => (
                  <Link
                    key={episode.episodeId}
                    href={`/watch/uploaded/${seriesId}/${episode.episodeNumber}`}
                    className={`block p-3 rounded-lg hover:bg-gray-800 transition ${
                      episode.episodeNumber === parseInt(episodeNumber) ? 'bg-gray-800 border border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Episode {episode.episodeNumber}: {episode.title}</p>
                        <p className="text-sm text-gray-400">
                          {episode.isFree || episode.episodeNumber === 1 ? 'Free' : `${episode.credits || 30} credits`}
                        </p>
                      </div>
                      {episode.episodeNumber > 1 && !episode.isFree && !(episode.episodeNumber === parseInt(episodeNumber) && isUnlocked) && <Lock className="w-4 h-4 text-gray-600" />}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}