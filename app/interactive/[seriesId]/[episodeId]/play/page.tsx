'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Home,
  GitBranch,
  Clock,
  ChevronRight
} from 'lucide-react';
import { InteractiveSeries, InteractiveEpisode, StoryNode, Choice } from '@/types/interactive';

export default function InteractivePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.seriesId as string;
  const episodeId = params.episodeId as string;
  
  const [series, setSeries] = useState<InteractiveSeries | null>(null);
  const [episode, setEpisode] = useState<InteractiveEpisode | null>(null);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [choiceTimeout, setChoiceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchData();
  }, [seriesId, episodeId]);

  const fetchData = async () => {
    try {
      // Fetch series
      const seriesRes = await fetch('/api/interactive-series');
      const seriesData = await seriesRes.json();
      if (seriesData.success) {
        const currentSeries = seriesData.series.find((s: InteractiveSeries) => s.id === seriesId);
        setSeries(currentSeries);
      }

      // Fetch episode
      const episodeRes = await fetch(`/api/interactive-series/${seriesId}/episodes`);
      const episodeData = await episodeRes.json();
      if (episodeData.success) {
        const currentEpisode = episodeData.episodes.find((ep: InteractiveEpisode) => ep.id === episodeId);
        if (currentEpisode) {
          setEpisode(currentEpisode);
          
          // Start with the first node or start node
          const startNode = currentEpisode.nodes?.find(n => n.nodeType === 'start') || currentEpisode.nodes?.[0];
          if (startNode) {
            setCurrentNode(startNode);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Check if we need to show choices at this timestamp
      if (currentNode?.choices && currentNode.choices.length > 0) {
        const choiceTime = currentNode.timestamp || 30; // Default to 30 seconds
        if (time >= choiceTime && !showChoices) {
          setShowChoices(true);
          pauseForChoice();
        }
      }
    }
  };

  const pauseForChoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Auto-select first choice after 30 seconds
    const timeout = setTimeout(() => {
      if (currentNode?.choices && currentNode.choices.length > 0) {
        handleChoice(currentNode.choices[0]);
      }
    }, 30000);
    
    setChoiceTimeout(timeout);
  };

  const handleChoice = (choice: Choice) => {
    // Clear timeout
    if (choiceTimeout) {
      clearTimeout(choiceTimeout);
      setChoiceTimeout(null);
    }
    
    // Record choice in history
    setPathHistory([...pathHistory, choice.id]);
    
    // Find next node
    const nextNode = episode?.nodes?.find(n => n.id === choice.leadsToNodeId);
    if (nextNode) {
      setCurrentNode(nextNode);
      setShowChoices(false);
      setCurrentTime(0);
      
      // Play new audio if available
      if (nextNode.audioUrl && audioRef.current) {
        audioRef.current.src = nextNode.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // End of story
      alert('End of story path! Thanks for playing!');
    }
  };

  const handleRestart = () => {
    setPathHistory([]);
    setShowChoices(false);
    setCurrentTime(0);
    
    // Reset to start node
    const startNode = episode?.nodes?.find(n => n.nodeType === 'start') || episode?.nodes?.[0];
    if (startNode) {
      setCurrentNode(startNode);
      if (audioRef.current && startNode.audioUrl) {
        audioRef.current.src = startNode.audioUrl;
        audioRef.current.currentTime = 0;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!episode || !currentNode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Episode not found or not published</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg backdrop-blur"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{series?.title}</h1>
            <p className="text-gray-400">Episode {episode.episodeNumber}: {episode.title}</p>
          </div>
          <button
            onClick={handleRestart}
            className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg backdrop-blur"
            title="Restart Story"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Story Display */}
        <div className="bg-black/50 backdrop-blur rounded-xl p-8 mb-6 min-h-[400px]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-400" />
              {currentNode.title}
            </h2>
            {currentNode.description && (
              <p className="text-gray-300">{currentNode.description}</p>
            )}
          </div>

          {/* Choice Display */}
          {showChoices && currentNode.choices && currentNode.choices.length > 0 && (
            <div className="mt-8">
              <p className="text-sm text-purple-400 mb-4 animate-pulse">
                What will you choose?
              </p>
              <div className="space-y-3">
                {currentNode.choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 border border-purple-600 rounded-lg text-left transition-all hover:scale-[1.02] flex items-center gap-3"
                  >
                    <span className="text-2xl font-bold text-purple-400">{index + 1}</span>
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                    <span className="flex-1">{choice.text}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Auto-selecting first choice in 30 seconds...
              </p>
            </div>
          )}

          {/* Path History */}
          {pathHistory.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Your journey so far:</p>
              <div className="flex flex-wrap gap-2">
                {pathHistory.map((choiceId, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-900/30 rounded text-xs">
                    Choice {index + 1}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Player Controls */}
        <div className="bg-black/50 backdrop-blur rounded-xl p-6">
          <audio
            ref={audioRef}
            src={currentNode.audioUrl || ''}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlay}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-all hover:scale-110"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
            
            <Volume2 className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🎧 Put on your headphones for the best experience</p>
          <p className="mt-1">Choices will appear at key moments in the story</p>
        </div>
      </div>
    </div>
  );
}