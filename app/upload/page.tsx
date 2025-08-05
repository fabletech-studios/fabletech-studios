'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Upload, Film, Music, FileVideo, FileAudio, X, Plus, DollarSign, Globe, Languages } from 'lucide-react';

interface Episode {
  title: string;
  description: string;
  language: string; // 'en' or 'it'
  isTranslation: boolean; // true if this is a translation of another episode
  originalEpisodeNumber?: number; // if translation, which episode number
  videoFile: File | null;
  audioFile: File | null;
  thumbnail: File | null;
  duration: string;
  credits: number;
  isFree: boolean;
}

export default function UploadPage() {
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  const handleFileUpload = (episodeIndex: number, fileType: 'video' | 'audio' | 'thumbnail', file: File) => {
    const newEpisodes = [...episodes];
    if (fileType === 'video') {
      newEpisodes[episodeIndex].videoFile = file;
    } else if (fileType === 'audio') {
      newEpisodes[episodeIndex].audioFile = file;
    } else {
      newEpisodes[episodeIndex].thumbnail = file;
    }
    setEpisodes(newEpisodes);
  };

  const createNewEpisode = (isFree = false): Episode => ({
    title: '',
    description: '',
    language: 'en',
    isTranslation: false,
    videoFile: null,
    audioFile: null,
    thumbnail: null,
    duration: '',
    credits: 0,
    isFree
  });

  const addEpisode = () => {
    setEpisodes([...episodes, createNewEpisode(false)]);
  };

  const removeEpisode = (index: number) => {
    setEpisodes(episodes.filter((_, i) => i !== index));
  };

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const newEpisodes = [...episodes];
    (newEpisodes[index] as any)[field] = value;
    setEpisodes(newEpisodes);
  };

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate we have at least one episode
    if (episodes.length === 0) {
      alert('Please add at least one episode');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('seriesTitle', seriesTitle);
      formData.append('seriesDescription', seriesDescription);
      
      // Add episode metadata
      const episodeMetadata = episodes.map(ep => ({
        title: ep.title,
        description: ep.description,
        language: ep.language,
        isTranslation: ep.isTranslation,
        originalEpisodeNumber: ep.originalEpisodeNumber,
        duration: ep.duration,
        credits: ep.credits,
        isFree: ep.isFree
      }));
      formData.append('episodes', JSON.stringify(episodeMetadata));

      // Add files for each episode
      episodes.forEach((episode, index) => {
        if (episode.videoFile) {
          formData.append(`video-${index}`, episode.videoFile);
        }
        if (episode.audioFile) {
          formData.append(`audio-${index}`, episode.audioFile);
        }
        if (episode.thumbnail) {
          formData.append(`thumbnail-${index}`, episode.thumbnail);
        }
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`Series uploaded successfully! Series ID: ${result.seriesId}`);
        // Reset form
        setSeriesTitle('');
        setSeriesDescription('');
        setEpisodes([]);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-red-600">FableTech Studios</Link>
            <Link href="/browse" className="hover:text-gray-300">Back to Browse</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Audiobook Series</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Series Information */}
          <div className="bg-gray-900 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Series Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Series Title</label>
              <input
                type="text"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Enter your audiobook series title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Series Description</label>
              <textarea
                value={seriesDescription}
                onChange={(e) => setSeriesDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 h-32"
                placeholder="Describe your audiobook series"
                required
              />
            </div>
          </div>

          {/* Episodes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Episodes</h2>
              <button
                type="button"
                onClick={addEpisode}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Episode
              </button>
            </div>

            {episodes.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">No episodes added yet</p>
                <button
                  type="button"
                  onClick={() => setEpisodes([createNewEpisode(true)])}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Add First Episode
                </button>
              </div>
            ) : (
              episodes.map((episode, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Episode {index + 1}</h3>
                  <div className="flex items-center gap-4">
                    {/* Language Selection */}
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <select
                        value={episode.language}
                        onChange={(e) => updateEpisode(index, 'language', e.target.value)}
                        className="px-3 py-1 bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="it">🇮🇹 Italian</option>
                      </select>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeEpisode(index)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Episode Title</label>
                    <input
                      type="text"
                      value={episode.title}
                      onChange={(e) => updateEpisode(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="Episode title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Duration</label>
                    <input
                      type="text"
                      value={episode.duration}
                      onChange={(e) => updateEpisode(index, 'duration', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="e.g., 45:00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Episode Description</label>
                  <textarea
                    value={episode.description}
                    onChange={(e) => updateEpisode(index, 'description', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Episode description"
                    rows={2}
                  />
                </div>

                {/* Translation Options - Only show for non-English episodes */}
                {episode.language !== 'en' && (
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Translation Options</span>
                    </div>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={episode.isTranslation}
                        onChange={(e) => updateEpisode(index, 'isTranslation', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-800 rounded focus:ring-blue-600"
                      />
                      <span>This is a translation of an existing episode</span>
                    </label>

                    {episode.isTranslation && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Original Episode Number</label>
                        <select
                          value={episode.originalEpisodeNumber || ''}
                          onChange={(e) => updateEpisode(index, 'originalEpisodeNumber', parseInt(e.target.value) || undefined)}
                          className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">Select original episode</option>
                          {episodes.filter((ep, i) => i !== index && ep.language === 'en').map((ep, i) => (
                            <option key={i} value={i + 1}>Episode {i + 1}: {ep.title || 'Untitled'}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          The translation will be linked to the original episode
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* File uploads */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video File</label>
                    <label className="block">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'video', e.target.files[0])}
                        className="hidden"
                      />
                      <div className="bg-gray-800 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition">
                        <FileVideo className="w-8 h-8 mx-auto mb-2 text-red-600" />
                        <span className="text-sm">
                          {episode.videoFile ? episode.videoFile.name : 'Upload Video'}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Audio File</label>
                    <label className="block">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'audio', e.target.files[0])}
                        className="hidden"
                      />
                      <div className="bg-gray-800 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition">
                        <FileAudio className="w-8 h-8 mx-auto mb-2 text-red-600" />
                        <span className="text-sm">
                          {episode.audioFile ? episode.audioFile.name : 'Upload Audio'}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Thumbnail</label>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'thumbnail', e.target.files[0])}
                        className="hidden"
                      />
                      <div className="bg-gray-800 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition">
                        <Film className="w-8 h-8 mx-auto mb-2 text-red-600" />
                        <span className="text-sm">
                          {episode.thumbnail ? episode.thumbnail.name : 'Upload Thumbnail'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Monetization */}
                <div className="border-t border-gray-800 pt-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={episode.isFree || index === 0}
                      onChange={(e) => updateEpisode(index, 'isFree', e.target.checked)}
                      className="w-5 h-5 text-red-600 bg-gray-800 rounded focus:ring-red-600"
                      disabled={index === 0}
                    />
                    <span>{index === 0 ? 'Free Episode (First episode is always free)' : 'Free Episode'}</span>
                  </label>

                  {!episode.isFree && index !== 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">Credits Required</label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-500" />
                        <input
                          type="number"
                          min="0"
                          value={episode.credits}
                          onChange={(e) => updateEpisode(index, 'credits', parseInt(e.target.value) || 0)}
                          className="w-32 px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-400">credits</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> Upload Series
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}