'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  GitBranch, 
  Save, 
  X, 
  Trash2,
  PlayCircle,
  PauseCircle,
  Upload,
  Edit
} from 'lucide-react';
import { InteractiveSeries, InteractiveEpisode, StoryNode } from '@/types/interactive';

export default function InteractiveEpisodesPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.seriesId as string;
  
  const [series, setSeries] = useState<InteractiveSeries | null>(null);
  const [episodes, setEpisodes] = useState<InteractiveEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state for new episode
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [creditCost, setCreditCost] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<InteractiveEpisode | null>(null);

  useEffect(() => {
    if (seriesId) {
      fetchSeriesAndEpisodes();
    }
  }, [seriesId]);

  const fetchSeriesAndEpisodes = async () => {
    try {
      // Fetch series details
      const seriesRes = await fetch('/api/interactive-series');
      const seriesData = await seriesRes.json();
      if (seriesData.success) {
        const currentSeries = seriesData.series.find((s: InteractiveSeries) => s.id === seriesId);
        setSeries(currentSeries);
      }

      // Fetch episodes
      const episodesRes = await fetch(`/api/interactive-series/${seriesId}/episodes`);
      const episodesData = await episodesRes.json();
      if (episodesData.success) {
        setEpisodes(episodesData.episodes);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateEpisode = async () => {
    if (!episodeTitle) {
      alert('Please provide a title');
      return;
    }

    setUploading(true);
    
    try {
      if (editingEpisode) {
        // Update existing episode
        const response = await fetch(`/api/interactive-series/${seriesId}/episodes/${editingEpisode.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: episodeTitle,
            description: episodeDescription,
            episodeNumber,
            creditCost,
          }),
        });

        const data = await response.json();
        if (data.success) {
          await fetchSeriesAndEpisodes();
          setShowCreateModal(false);
          resetForm();
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        // Create new episode
        const formData = new FormData();
        if (audioFile) {
          formData.append('audio', audioFile);
        }
        formData.append('episodeData', JSON.stringify({
          seriesId,
          episodeNumber,
          title: episodeTitle,
          description: episodeDescription,
          creditCost,
          forkType: 'episode',
          nodes: [],
        }));

        const response = await fetch(`/api/interactive-series/${seriesId}/episodes`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          await fetchSeriesAndEpisodes();
          setShowCreateModal(false);
          resetForm();
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to save episode:', error);
      alert('Failed to save episode');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) {
      return;
    }

    try {
      const response = await fetch(`/api/interactive-series/${seriesId}/episodes/${episodeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchSeriesAndEpisodes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete episode:', error);
      alert('Failed to delete episode');
    }
  };

  const handleEditEpisode = (episode: InteractiveEpisode) => {
    setEditingEpisode(episode);
    setEpisodeTitle(episode.title);
    setEpisodeDescription(episode.description || '');
    setEpisodeNumber(episode.episodeNumber);
    setCreditCost(episode.creditCost);
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeNumber(episodes.length + 1);
    setCreditCost(1);
    setAudioFile(null);
    setEditingEpisode(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Series not found</p>
          <button
            onClick={() => router.push('/manage')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/manage')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-purple-500" />
              {series.title} - Interactive Episodes
            </h1>
            <p className="text-gray-400 mt-1">{series.description}</p>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-purple-400 mb-3">🎮 Quick Start Workflow</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">1.</span>
              <div>
                <strong>Create Episode</strong> - Start with a simple linear episode
                <p className="text-gray-500">Upload main audio file and set basic info</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">2.</span>
              <div>
                <strong>Add Choice Points</strong> - Define where players make decisions
                <p className="text-gray-500">Set timestamps where choices appear</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">3.</span>
              <div>
                <strong>Upload Branch Audio</strong> - Add alternative audio paths
                <p className="text-gray-500">Each choice leads to different audio</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">4.</span>
              <div>
                <strong>Test & Publish</strong> - Preview the experience
                <p className="text-gray-500">Test all paths before making it live</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Episodes List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Episodes</h2>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Episode
          </button>
        </div>

        {episodes.length === 0 ? (
          <div className="bg-gray-900/50 rounded-lg p-12 text-center">
            <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No episodes yet</p>
            <p className="text-sm text-gray-500 mt-2">Create your first interactive episode to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              Create First Episode
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {episodes.map((episode) => (
              <div key={episode.id} className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Episode {episode.episodeNumber}: {episode.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{episode.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{episode.creditCost} credits</span>
                      <span>•</span>
                      <span>{episode.nodes?.length || 0} nodes</span>
                      <span>•</span>
                      <span>{episode.forkType} level</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditEpisode(episode)}
                      className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg"
                      title="Edit Episode"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteEpisode(episode.id)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg"
                      title="Delete Episode"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Episode Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-lg w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h4 className="font-semibold text-lg">
                  {editingEpisode ? 'Edit Episode' : 'Create Interactive Episode'}
                </h4>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Episode Number</label>
                  <input
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                    placeholder="The Mysterious Choice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={episodeDescription}
                    onChange={(e) => setEpisodeDescription(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 h-20"
                    placeholder="Players must decide..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Credit Cost</label>
                  <input
                    type="number"
                    value={creditCost}
                    onChange={(e) => setCreditCost(parseInt(e.target.value))}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                    min="0"
                  />
                </div>

                {!editingEpisode && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Main Audio File</label>
                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label htmlFor="audio-upload" className="cursor-pointer">
                        {audioFile ? (
                          <span className="text-sm text-purple-400">{audioFile.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Click to upload audio</span>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <p className="text-xs text-blue-400">
                    💡 Start with main audio. You can add branches and choices after creating the episode.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdateEpisode}
                  disabled={uploading || !episodeTitle || (!editingEpisode && !audioFile)}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {editingEpisode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingEpisode ? 'Update Episode' : 'Create Episode'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}