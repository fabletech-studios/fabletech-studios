'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Lock, Coins } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import CustomerHeader from '@/components/CustomerHeader';
import MobileNav from '@/components/MobileNav';
import { addUserActivity } from '@/lib/firebase/activity-service';
import PremiumLogo from '@/components/PremiumLogo';

const UniversalPlayer = dynamic(() => import('@/components/video/UniversalPlayer'), {
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
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const { customer, updateCredits } = useFirebaseCustomerAuth();
  const router = useRouter();
  const notify = useNotifications();

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

    console.log('Checking unlock status for:', { seriesId, episodeNumber });
    
    try {
      // Try v2 endpoint first, fallback to original
      let res = await fetch(`/api/customer/unlock-episode-v2?seriesId=${seriesId}&episodeNumber=${episodeNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.log('v2 endpoint failed, trying original');
        // Fallback to original endpoint
        res = await fetch(`/api/customer/unlock-episode?seriesId=${seriesId}&episodeNumber=${episodeNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (res.ok) {
        const data = await res.json();
        console.log('Unlock check response:', data);
        setIsUnlocked(data.isUnlocked);
      } else {
        console.error('Failed to check unlock status:', res.status);
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
      notify.warning('Insufficient Credits', 'Please purchase more credits to unlock this episode.');
      return;
    }

    setUnlocking(true);
    const token = localStorage.getItem('customerToken');
    
    try {
      // Try v2 endpoint first, fallback to original
      let res = await fetch('/api/customer/unlock-episode-v2', {
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

      let data = await res.json();
      
      // If v2 endpoint failed, try original
      if (!res.ok || !data.success) {
        res = await fetch('/api/customer/unlock-episode', {
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
        data = await res.json();
      }
      
      if (data.success) {
        console.log('Unlock successful, setting isUnlocked to true');
        setIsUnlocked(true);
        updateCredits(data.remainingCredits);
        if (!data.alreadyUnlocked) {
          notify.episodeUnlocked();
          notify.creditsDeducted(episodeCredits);
        }
        // Don't re-check - we already know it's unlocked
      } else {
        notify.error('Unlock Failed', data.error || 'Failed to unlock episode');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      notify.error('Unlock Failed', 'Please try again later.');
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
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <PremiumLogo size="sm" showText={false} />
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/browse" className="hover:text-gray-300 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="hidden md:block">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
        <div className="w-full">
            {isUnlocked ? (
              <UniversalPlayer
                initialEpisode={currentEpisode}
                series={series}
                isUnlocked={isUnlocked}
              />
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
      </main>
    </div>
  );
}