'use client';

import { useState } from 'react';
import EnhancedPlayer from '@/components/video/EnhancedPlayer';
import SiteHeader from '@/components/SiteHeader';

export default function TestPlayerPage() {
  const [currentEpisodeId, setCurrentEpisodeId] = useState('1');
  const [userCredits, setUserCredits] = useState(100);
  const [unlockedEpisodes, setUnlockedEpisodes] = useState<string[]>(['1']);
  
  // Test episodes data
  const episodes = [
    {
      id: '1',
      title: 'The Beginning',
      description: 'Our story begins in a mysterious land...',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
      duration: '10:34',
      episodeNumber: 1,
      seriesTitle: 'Test Series',
      nextEpisodeId: '2',
      previousEpisodeId: undefined,
      isLocked: false,
      credits: 0
    },
    {
      id: '2',
      title: 'The Journey',
      description: 'The adventure continues...',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      duration: '9:56',
      episodeNumber: 2,
      seriesTitle: 'Test Series',
      nextEpisodeId: '3',
      previousEpisodeId: '1',
      isLocked: true,
      credits: 30
    },
    {
      id: '3',
      title: 'The Finale',
      description: 'Everything comes to an end...',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
      duration: '15:14',
      episodeNumber: 3,
      seriesTitle: 'Test Series',
      nextEpisodeId: undefined,
      previousEpisodeId: '2',
      isLocked: true,
      credits: 50
    }
  ].map(ep => ({
    ...ep,
    isLocked: !unlockedEpisodes.includes(ep.id)
  }));

  const currentEpisode = episodes.find(ep => ep.id === currentEpisodeId) || episodes[0];

  const handleEpisodeChange = (episodeId: string) => {
    console.log('Switching to episode:', episodeId);
    setCurrentEpisodeId(episodeId);
  };

  const handleUnlockEpisode = async (episodeId: string) => {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode) return false;
    
    const cost = episode.credits || 50;
    if (userCredits >= cost) {
      // Deduct credits
      setUserCredits(prev => prev - cost);
      // Unlock episode
      setUnlockedEpisodes(prev => [...prev, episodeId]);
      console.log(`Unlocked episode ${episodeId} for ${cost} credits`);
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Enhanced Player Test</h1>
            <p className="text-gray-400">Testing all player features</p>
          </div>
          <div className="bg-gray-900 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-gray-400">Credits:</span>
            <span className="text-yellow-500 font-bold text-xl">{userCredits}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player */}
          <div className="lg:col-span-2">
            <EnhancedPlayer
              episode={currentEpisode}
              episodes={episodes}
              onEpisodeChange={handleEpisodeChange}
              onUnlockEpisode={handleUnlockEpisode}
              userCredits={userCredits}
              autoplay={true}
              onComplete={() => console.log('Episode completed')}
            />
            
            {/* Episode Info */}
            <div className="mt-6 bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">{currentEpisode.title}</h2>
              <p className="text-gray-400 mb-4">Episode {currentEpisode.episodeNumber} • {currentEpisode.duration}</p>
              <p className="text-gray-300">{currentEpisode.description}</p>
            </div>
          </div>

          {/* Episode List */}
          <div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-bold mb-4">Episodes</h3>
              <div className="space-y-2">
                {episodes.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => handleEpisodeChange(ep.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      ep.id === currentEpisodeId 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Episode {ep.episodeNumber}</p>
                        <p className="text-sm opacity-75">{ep.title}</p>
                        {ep.isLocked && (
                          <p className="text-xs text-yellow-500 mt-1">
                            🔒 {ep.credits} credits
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm opacity-75">{ep.duration}</span>
                        {ep.isLocked && (
                          <div className="text-yellow-500 text-xs mt-1">Locked</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Player Features */}
            <div className="mt-4 bg-gray-900 rounded-lg p-4">
              <h3 className="font-bold mb-4">Player Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✅ Video/Audio toggle</li>
                <li>✅ Autoplay next episode</li>
                <li>✅ Keyboard shortcuts</li>
                <li>✅ Volume control & memory</li>
                <li>✅ Playback speed control</li>
                <li>✅ Fullscreen mode</li>
                <li>✅ Progress bar with seeking</li>
                <li>✅ Comments panel</li>
                <li>✅ Skip forward/backward</li>
                <li>✅ Seamless episode switching</li>
              </ul>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-4 bg-gray-900 rounded-lg p-4">
              <h3 className="font-bold mb-4">Keyboard Shortcuts</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">Space</kbd> Play/Pause</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">←</kbd> Skip back 10s</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">→</kbd> Skip forward 10s</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">↑</kbd> Volume up</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">↓</kbd> Volume down</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">M</kbd> Mute/Unmute</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">F</kbd> Fullscreen</li>
                <li><kbd className="bg-gray-800 px-2 py-1 rounded">C</kbd> Comments</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}