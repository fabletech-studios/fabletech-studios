'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, Lock, Coins } from 'lucide-react';

const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), {
  ssr: false,
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
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userCredits, setUserCredits] = useState(100); // Mock user credits
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');

  useEffect(() => {
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
    }
  };

  const handlePurchaseCredits = () => {
    // Mock purchase - in real app, integrate payment gateway
    setUserCredits(userCredits + 100);
    alert('100 credits added! (Mock purchase)');
  };

  if (!episode) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

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
                <h1 className="text-lg font-semibold">{episode.seriesTitle}</h1>
                <p className="text-sm text-gray-400">Episode {episode.episodeNumber}: {episode.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{userCredits}</span>
              </div>
              <button
                onClick={handlePurchaseCredits}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold"
              >
                Buy Credits
              </button>
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
                  >
                    <Play className="w-4 h-4" /> Video
                  </button>
                  <button
                    onClick={() => setMediaType('audio')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      mediaType === 'audio' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" /> Audio Only
                  </button>
                </div>

                {/* Video/Audio Player */}
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {mediaType === 'video' ? (
                    <VideoPlayer
                      src={episode.videoUrl}
                      poster={episode.thumbnailUrl}
                      onReady={(player) => {
                        // Player ready
                      }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8">
                      <img
                        src={episode.thumbnailUrl}
                        alt={episode.title}
                        className="w-48 h-48 rounded-lg mb-8 object-cover"
                      />
                      <audio
                        controls
                        autoPlay={false}
                        className="w-full max-w-md"
                        src={episode.audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>

                {/* Episode Navigation */}
                <div className="flex justify-between items-center">
                  {episode.previousEpisodeId ? (
                    <Link
                      href={`/watch/${episode.previousEpisodeId}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      <SkipBack className="w-4 h-4" /> Previous
                    </Link>
                  ) : (
                    <div />
                  )}
                  
                  {episode.nextEpisodeId && (
                    <Link
                      href={`/watch/${episode.nextEpisodeId}`}
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
    </div>
  );
}