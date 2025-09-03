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
  const [audioReady, setAudioReady] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPausingForChoice = useRef(false);

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
          console.log('Episode loaded:', currentEpisode);
          console.log('StartNodeId:', currentEpisode.startNodeId);
          console.log('Nodes:', currentEpisode.nodes);
          
          // Use startNodeId if available, otherwise find start node, otherwise use first node
          let startNode = null;
          if (currentEpisode.startNodeId) {
            startNode = currentEpisode.nodes?.find(n => n.id === currentEpisode.startNodeId);
          }
          if (!startNode) {
            startNode = currentEpisode.nodes?.find(n => n.nodeType === 'start');
          }
          if (!startNode && currentEpisode.nodes?.length > 0) {
            startNode = currentEpisode.nodes[0];
          }
          
          if (startNode) {
            console.log('Starting with node:', startNode);
            console.log('Node has choices?', startNode.choices);
            console.log('Node timestamp:', startNode.timestamp);
            
            // If start node has a nextNodeId and no audio, jump to next node immediately
            if (!startNode.audioUrl && startNode.nextNodeId) {
              const nextNode = currentEpisode.nodes?.find(n => n.id === startNode.nextNodeId);
              if (nextNode) {
                console.log('Start node has no audio, jumping to:', nextNode);
                setCurrentNode(nextNode);
              } else {
                setCurrentNode(startNode);
              }
            } else {
              setCurrentNode(startNode);
            }
          } else {
            console.error('No start node found!');
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
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log('Audio play prevented:', err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Check if we need to show choices at this timestamp
      if (currentNode?.choices && currentNode.choices.length > 0 && !showChoices) {
        // If it's a choice node, show choices based on timestamp or at end of audio
        const choiceTime = currentNode.timestamp !== undefined ? currentNode.timestamp : 30; // Default to 30 seconds
        
        // Debug logging
        if (Math.floor(time) % 5 === 0) { // Log every 5 seconds
          console.log(`Time: ${time}s, Choice time: ${choiceTime}s, Will show at: ${choiceTime}s`);
        }
        
        if (time >= choiceTime) {
          console.log('Showing choices now!', currentNode.choices);
          setShowChoices(true);
          pauseForChoice();
        }
      }
    }
  };

  const pauseForChoice = () => {
    // Prevent multiple pause calls
    if (isPausingForChoice.current) return;
    isPausingForChoice.current = true;
    
    if (audioRef.current && !audioRef.current.paused) {
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
    console.log('Choice selected:', choice);
    console.log('Looking for node:', choice.leadsToNodeId);
    console.log('Available nodes:', episode?.nodes?.map(n => ({ id: n.id, title: n.title })));
    
    // Clear timeout
    if (choiceTimeout) {
      clearTimeout(choiceTimeout);
      setChoiceTimeout(null);
    }
    
    // Reset pause flag
    isPausingForChoice.current = false;
    
    // Record choice in history
    setPathHistory([...pathHistory, choice.id]);
    
    // Find next node
    const nextNode = episode?.nodes?.find(n => n.id === choice.leadsToNodeId);
    if (nextNode) {
      console.log('Moving to node:', nextNode);
      setCurrentNode(nextNode);
      setShowChoices(false);
      setCurrentTime(0);
      setAudioReady(false);
      
      // Play new audio if available
      if (nextNode.audioUrl && audioRef.current) {
        audioRef.current.src = nextNode.audioUrl;
        // Use a small delay to ensure audio is loaded before playing
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.log('Audio play prevented:', err);
              setIsPlaying(false);
            });
            setIsPlaying(true);
          }
        }, 100);
      }
    } else {
      console.error('Next node not found! Looking for:', choice.leadsToNodeId);
      // Check if this is an end node or if we should show an error
      if (choice.leadsToNodeId === 'end' || choice.leadsToNodeId === 'end_node') {
        alert('You\'ve reached the end of this story path! Thanks for playing!');
      } else {
        alert('Error: Next part of the story not found. Please notify the author.');
      }
    }
  };

  const handleRestart = () => {
    setPathHistory([]);
    setShowChoices(false);
    setCurrentTime(0);
    isPausingForChoice.current = false;
    
    // Reset to start node using same logic as initial load
    let startNode = null;
    if (episode?.startNodeId) {
      startNode = episode.nodes?.find(n => n.id === episode.startNodeId);
    }
    if (!startNode) {
      startNode = episode?.nodes?.find(n => n.nodeType === 'start');
    }
    if (!startNode && episode?.nodes?.length) {
      startNode = episode.nodes[0];
    }
    
    if (startNode) {
      console.log('Restarting with node:', startNode);
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
            <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                {currentNode.title}
              </div>
              {/* Debug: Force show choices button */}
              {currentNode.choices && currentNode.choices.length > 0 && !showChoices && (
                <button
                  onClick={() => {
                    console.log('Manually showing choices');
                    setShowChoices(true);
                    pauseForChoice();
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                >
                  Show Choices (Debug)
                </button>
              )}
            </h2>
            {currentNode.description && (
              <p className="text-gray-300">{currentNode.description}</p>
            )}
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Node type: {currentNode.nodeType} | 
              Has choices: {currentNode.choices ? `Yes (${currentNode.choices.length})` : 'No'} | 
              Timestamp: {currentNode.timestamp ?? 'not set'}
            </div>
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
            onCanPlay={() => setAudioReady(true)}
            onLoadStart={() => setAudioReady(false)}
          />
          
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={!audioReady && !currentNode.audioUrl}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-all hover:scale-110"
            >
              {!audioReady && currentNode.audioUrl ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
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