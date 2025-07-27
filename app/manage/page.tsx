'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  Film, Plus, Trash2, Edit, Save, X, Upload, 
  FileVideo, FileAudio, Image, GripVertical,
  LogOut, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import { 
  validateVideoFile, 
  validateAudioFile, 
  validateImageFile, 
  formatFileSize,
  getMediaRecommendations,
  calculateStorageCost,
  analyzeFileOptimization,
  type FileValidationResult 
} from '@/lib/file-validation';
import UploadProgress from '@/components/UploadProgress';
import BannerManager from '@/components/BannerManager';
import MediaOptimizationPanel from '@/components/MediaOptimizationPanel';
import StorageAnalyticsDashboard from '@/components/StorageAnalyticsDashboard';
import SeriesBannerUpload from '@/components/SeriesBannerUpload';
import PremiumLogo from '@/components/PremiumLogo';

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
  duration?: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  episodes: Episode[];
  createdAt: string;
}

export default function ManagePage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [addingEpisodeToSeries, setAddingEpisodeToSeries] = useState<string | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<{ seriesId: string; episodeId: string } | null>(null);
  
  // New series form state
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDescription, setNewSeriesDescription] = useState('');
  const [newEpisodes, setNewEpisodes] = useState<any[]>([]);
  
  // Add episode form state
  const [newEpisodeNumber, setNewEpisodeNumber] = useState<number | ''>('');
  const [newEpisodeTitle, setNewEpisodeTitle] = useState('');
  const [newEpisodeDescription, setNewEpisodeDescription] = useState('');
  const [newEpisodeDuration, setNewEpisodeDuration] = useState('');
  const [newEpisodeCredits, setNewEpisodeCredits] = useState(50);
  const [newEpisodeIsFree, setNewEpisodeIsFree] = useState(false);
  const [newEpisodeVideoFile, setNewEpisodeVideoFile] = useState<File | null>(null);
  const [newEpisodeAudioFile, setNewEpisodeAudioFile] = useState<File | null>(null);
  const [newEpisodeThumbnailFile, setNewEpisodeThumbnailFile] = useState<File | null>(null);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [currentUploadFile, setCurrentUploadFile] = useState<string>('');
  
  // Validation and optimization state
  const [videoValidation, setVideoValidation] = useState<FileValidationResult | null>(null);
  const [audioValidation, setAudioValidation] = useState<FileValidationResult | null>(null);
  const [showOptimizationTips, setShowOptimizationTips] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      if (data.success) {
        setSeries(data.series);
      }
    } catch (error) {
      console.error('Failed to load series:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSeries = async (seriesId: string) => {
    if (!confirm('Delete this entire series? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/content/${seriesId}/delete`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setSeries(series.filter(s => s.id !== seriesId));
      }
    } catch (error) {
      console.error('Error deleting series:', error);
    }
  };

  const deleteEpisode = async (seriesId: string, episodeId: string) => {
    if (!confirm('Delete this episode?')) return;

    try {
      const res = await fetch(`/api/content/${seriesId}/episode/${episodeId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        loadSeries(); // Reload to get updated episode numbers
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
    }
  };

  const addNewEpisode = () => {
    setNewEpisodes([...newEpisodes, {
      title: '',
      description: '',
      videoFile: null,
      audioFile: null,
      thumbnailFile: null,
      duration: '',
      credits: 50,
      isFree: newEpisodes.length === 0
    }]);
  };

  const removeNewEpisode = (index: number) => {
    setNewEpisodes(newEpisodes.filter((_, i) => i !== index));
  };

  const handleNewSeriesSubmit = async () => {
    
    if (!newSeriesTitle || newEpisodes.length === 0) {
      setUploadError('Please add a title and at least one episode');
      return;
    }

      title: newSeriesTitle,
      description: newSeriesDescription,
      episodes: newEpisodes.length
    });

    // Validate files before submission
    for (let i = 0; i < newEpisodes.length; i++) {
      const episode = newEpisodes[i];
        title: episode.title,
        hasVideo: !!episode.videoFile,
        hasAudio: !!episode.audioFile,
        hasThumbnail: !!episode.thumbnailFile
      });

      // Check video file validation
      if (episode.videoFile) {
        const videoValidation = validateVideoFile(episode.videoFile);
        if (!videoValidation.valid) {
          console.error('❌ Video validation failed:', videoValidation.error);
          setUploadError(`Episode ${i + 1} video error: ${videoValidation.error}`);
          return;
        }
      }

      // Check audio file validation
      if (episode.audioFile) {
        const audioValidation = validateAudioFile(episode.audioFile);
        if (!audioValidation.valid) {
          console.error('❌ Audio validation failed:', audioValidation.error);
          setUploadError(`Episode ${i + 1} audio error: ${audioValidation.error}`);
          return;
        }
      }

      // Check thumbnail validation
      if (episode.thumbnailFile) {
        const thumbnailValidation = validateImageFile(episode.thumbnailFile);
        if (!thumbnailValidation.valid) {
          console.error('❌ Thumbnail validation failed:', thumbnailValidation.error);
          setUploadError(`Episode ${i + 1} thumbnail error: ${thumbnailValidation.error}`);
          return;
        }
      }
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      
      // Step 1: Create series in Firestore first
      const seriesData = {
        title: newSeriesTitle,
        description: newSeriesDescription,
        episodes: [],
        createdAt: new Date().toISOString()
      };

      
      const createSeriesResponse = await fetch('/api/series/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(seriesData)
      });

      if (!createSeriesResponse.ok) {
        const errorData = await createSeriesResponse.text();
        console.error('❌ Series creation failed:', errorData);
        throw new Error('Failed to create series: ' + errorData);
      }

      const seriesResult = await createSeriesResponse.json();
      const seriesId = seriesResult.seriesId || seriesResult.id;

      // Step 2: Upload episodes one by one to the new series
      for (let i = 0; i < newEpisodes.length; i++) {
        const episode = newEpisodes[i];
        
        const episodeFormData = new FormData();
        
        const episodeData = {
          episodeNumber: i + 1,
          title: episode.title,
          description: episode.description || '',
          duration: episode.duration,
          credits: episode.credits,
          isFree: episode.isFree
        };
        
        episodeFormData.append('episodeData', JSON.stringify(episodeData));
        
        if (episode.videoFile) {
          episodeFormData.append('video', episode.videoFile);
        }
        if (episode.audioFile) {
          episodeFormData.append('audio', episode.audioFile);
        }
        if (episode.thumbnailFile) {
          episodeFormData.append('thumbnail', episode.thumbnailFile);
        }

        const episodeResponse = await fetch(`/api/content/${seriesId}/episode`, {
          method: 'POST',
          body: episodeFormData
        });

        if (!episodeResponse.ok) {
          const errorData = await episodeResponse.text();
          console.error(`❌ Episode ${i + 1} upload failed:`, errorData);
          throw new Error(`Failed to upload episode ${i + 1}: ${errorData}`);
        }

        const episodeResult = await episodeResponse.json();
        
        // Update progress
        const progress = ((i + 1) / newEpisodes.length) * 100;
        setUploadProgress(progress);
      }

      setUploadStatus('success');
      
      // Reset form
      setNewSeriesTitle('');
      setNewSeriesDescription('');
      setNewEpisodes([]);
      setShowNewSeriesForm(false);
      loadSeries();
      
      alert('Series created successfully!');

    } catch (error) {
      console.error('💥 Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleVideoFileSelect = (file: File | null) => {
    if (!file) {
      setNewEpisodeVideoFile(null);
      setVideoValidation(null);
      return;
    }

    const validation = validateVideoFile(file);
    setVideoValidation(validation);
    
    if (!validation.valid) {
      alert(`${validation.error}${validation.recommendation ? '\n\nRecommendation: ' + validation.recommendation : ''}`);
      return;
    }

    setNewEpisodeVideoFile(file);
    
    // Show recommendations if file is valid but could be optimized
    if (validation.recommendation) {
    }
  };

  const handleAudioFileSelect = (file: File | null) => {
    if (!file) {
      setNewEpisodeAudioFile(null);
      setAudioValidation(null);
      return;
    }

    const validation = validateAudioFile(file);
    setAudioValidation(validation);
    
    if (!validation.valid) {
      alert(`${validation.error}${validation.recommendation ? '\n\nRecommendation: ' + validation.recommendation : ''}`);
      return;
    }

    setNewEpisodeAudioFile(file);
    
    // Show recommendations if file is valid but could be optimized
    if (validation.recommendation) {
    }
  };

  const handleThumbnailFileSelect = (file: File | null) => {
    if (!file) {
      setNewEpisodeThumbnailFile(null);
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setNewEpisodeThumbnailFile(file);
  };

  const handleEditEpisode = (seriesId: string, episode: Episode) => {
    setEditingEpisode({ seriesId, episodeId: episode.episodeId });
    // Pre-populate form with episode data
    setNewEpisodeNumber(episode.episodeNumber);
    setNewEpisodeTitle(episode.title);
    setNewEpisodeDescription(episode.description || '');
    setNewEpisodeDuration(episode.duration || '');
    setNewEpisodeCredits(episode.credits || 50);
    setNewEpisodeIsFree(episode.isFree || false);
    // Files will be null initially (user can choose to replace them)
    setNewEpisodeVideoFile(null);
    setNewEpisodeAudioFile(null);
    setNewEpisodeThumbnailFile(null);
  };

  const handleUpdateEpisode = async () => {
    if (!editingEpisode) return;
    
    const { seriesId, episodeId } = editingEpisode;
    
    if (!newEpisodeTitle) {
      alert('Please provide a title');
      return;
    }

    const formData = new FormData();
    
    const episodeData = {
      episodeNumber: newEpisodeNumber || undefined,
      title: newEpisodeTitle,
      description: newEpisodeDescription,
      duration: newEpisodeDuration,
      credits: newEpisodeCredits,
      isFree: newEpisodeIsFree
    };
    formData.append('episodeData', JSON.stringify(episodeData));

    // Add files only if user selected new ones
    if (newEpisodeVideoFile) {
      formData.append('video', newEpisodeVideoFile);
    }
    if (newEpisodeAudioFile) {
      formData.append('audio', newEpisodeAudioFile);
    }
    if (newEpisodeThumbnailFile) {
      formData.append('thumbnail', newEpisodeThumbnailFile);
    }

    try {
      const res = await fetch(`/api/content/${seriesId}/episode/${episodeId}/update`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // Reset form and state
        setEditingEpisode(null);
        setNewEpisodeNumber('');
        setNewEpisodeTitle('');
        setNewEpisodeDescription('');
        setNewEpisodeDuration('');
        setNewEpisodeCredits(50);
        setNewEpisodeIsFree(false);
        setNewEpisodeVideoFile(null);
        setNewEpisodeAudioFile(null);
        setNewEpisodeThumbnailFile(null);
        
        loadSeries();
        alert('Episode updated successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to update episode: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating episode:', error);
      alert('Failed to update episode');
    }
  };

  const handleAddEpisode = async (seriesId: string) => {
      title: newEpisodeTitle,
      description: newEpisodeDescription,
      duration: newEpisodeDuration,
      credits: newEpisodeCredits,
      isFree: newEpisodeIsFree,
      videoFile: newEpisodeVideoFile?.name,
      audioFile: newEpisodeAudioFile?.name,
      thumbnailFile: newEpisodeThumbnailFile?.name
    });
    
    if (!newEpisodeTitle || (!newEpisodeVideoFile && !newEpisodeAudioFile)) {
      alert('Please provide a title and at least one media file (video or audio)');
      return;
    }

    const formData = new FormData();
    
    const episodeData = {
      episodeNumber: newEpisodeNumber || undefined,
      title: newEpisodeTitle,
      description: newEpisodeDescription,
      duration: newEpisodeDuration,
      credits: newEpisodeCredits,
      isFree: newEpisodeIsFree
    };
    formData.append('episodeData', JSON.stringify(episodeData));

    // Add files
    if (newEpisodeVideoFile) {
      formData.append('video', newEpisodeVideoFile);
    }
    if (newEpisodeAudioFile) {
      formData.append('audio', newEpisodeAudioFile);
    }
    if (newEpisodeThumbnailFile) {
      formData.append('thumbnail', newEpisodeThumbnailFile);
    }

    try {
        video: newEpisodeVideoFile?.name,
        audio: newEpisodeAudioFile?.name,
        thumbnail: newEpisodeThumbnailFile?.name
      });
      
      // Set upload status
      setUploadStatus('uploading');
      setUploadProgress(0);
      setCurrentUploadFile(newEpisodeVideoFile?.name || newEpisodeAudioFile?.name || 'episode');
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      // Create promise for the request
      const uploadPromise = new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            });
            resolve(response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
        
        xhr.open('POST', `/api/content/${seriesId}/episode`);
        xhr.send(formData);
      });
      
      const res = await uploadPromise;
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', errorText);
      }

      if (res.ok) {
        setUploadStatus('success');
        
        // Reset form
        setNewEpisodeNumber('');
        setNewEpisodeTitle('');
        setNewEpisodeDescription('');
        setNewEpisodeDuration('');
        setNewEpisodeCredits(50);
        setNewEpisodeIsFree(false);
        setNewEpisodeVideoFile(null);
        setNewEpisodeAudioFile(null);
        setNewEpisodeThumbnailFile(null);
        
        // Hide the form
        const formDiv = document.getElementById(`episode-form-${seriesId}`);
        if (formDiv) {
          formDiv.style.display = 'none';
        }
        
        loadSeries();
        
        // Reset upload status after showing success
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
        }, 2000);
      } else {
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          setUploadError(errorData.error || 'Upload failed');
        } catch {
          setUploadError(`Failed to add episode: ${res.status}`);
        }
        setUploadStatus('error');
        
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
          setUploadError('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding episode:', error);
      setUploadStatus('error');
      setUploadError(error.message || 'Failed to add episode');
      
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
        setUploadError('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <PremiumLogo size="md" />
              <h1 className="text-xl font-semibold">Content Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-gray-300">
                View Site
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Management */}
        <div className="mb-8">
          <BannerManager />
        </div>

        {/* Storage Analytics Dashboard */}
        <div className="mb-8">
          <StorageAnalyticsDashboard />
        </div>

        {/* Add New Series Button */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowNewSeriesForm(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create New Series
          </button>
          <Link
            href="/upload/bulk"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold flex items-center gap-2"
          >
            <Upload className="w-5 h-5" /> Bulk Upload Episodes
          </Link>
        </div>

        {/* New Series Form */}
        {showNewSeriesForm && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Series</h2>
              <button
                onClick={() => {
                  setShowNewSeriesForm(false);
                  setNewSeriesTitle('');
                  setNewSeriesDescription('');
                  setNewEpisodes([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Series Title</label>
                <input
                  type="text"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Enter series title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Series Description</label>
                <textarea
                  value={newSeriesDescription}
                  onChange={(e) => setNewSeriesDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 h-24"
                  placeholder="Enter series description"
                />
              </div>
            </div>

            {/* Episodes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Episodes</h3>
                <button
                  onClick={addNewEpisode}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Episode
                </button>
              </div>

              {newEpisodes.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No episodes added yet</p>
              ) : (
                <div className="space-y-4">
                  {newEpisodes.map((episode, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Episode {index + 1}</h4>
                        <button
                          onClick={() => removeNewEpisode(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title</label>
                          <input
                            type="text"
                            value={episode.title}
                            onChange={(e) => {
                              const updated = [...newEpisodes];
                              updated[index].title = e.target.value;
                              setNewEpisodes(updated);
                            }}
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                            placeholder="Episode title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Duration</label>
                          <input
                            type="text"
                            value={episode.duration}
                            onChange={(e) => {
                              const updated = [...newEpisodes];
                              updated[index].duration = e.target.value;
                              setNewEpisodes(updated);
                            }}
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                            placeholder="e.g., 45:00"
                          />
                        </div>
                      </div>

                      {/* File uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <label className="block">
                          <span className="text-sm font-medium mb-1 block">Video File</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                const validation = validateVideoFile(file);
                                if (!validation.valid) {
                                  alert(validation.error);
                                  return;
                                }
                              }
                              const updated = [...newEpisodes];
                              updated[index].videoFile = file;
                              setNewEpisodes(updated);
                            }}
                            className="hidden"
                          />
                          <div className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600">
                            <FileVideo className="w-6 h-6 mx-auto mb-1 text-red-600" />
                            <span className="text-xs">
                              {episode.videoFile ? (
                                <>
                                  {episode.videoFile.name}
                                  <br />
                                  <span className="text-gray-400">{formatFileSize(episode.videoFile.size)}</span>
                                </>
                              ) : 'Choose Video'}
                            </span>
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium mb-1 block">Audio File</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const updated = [...newEpisodes];
                              updated[index].audioFile = e.target.files?.[0] || null;
                              setNewEpisodes(updated);
                            }}
                            className="hidden"
                          />
                          <div className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600">
                            <FileAudio className="w-6 h-6 mx-auto mb-1 text-red-600" />
                            <span className="text-xs">
                              {episode.audioFile ? episode.audioFile.name : 'Choose Audio'}
                            </span>
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium mb-1 block">Thumbnail</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const updated = [...newEpisodes];
                              updated[index].thumbnailFile = e.target.files?.[0] || null;
                              setNewEpisodes(updated);
                            }}
                            className="hidden"
                          />
                          <div className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600">
                            <Image className="w-6 h-6 mx-auto mb-1 text-red-600" />
                            <span className="text-xs">
                              {episode.thumbnailFile ? episode.thumbnailFile.name : 'Choose Thumbnail'}
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Monetization */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={episode.isFree}
                            onChange={(e) => {
                              const updated = [...newEpisodes];
                              updated[index].isFree = e.target.checked;
                              setNewEpisodes(updated);
                            }}
                            className="w-4 h-4"
                            disabled={index === 0}
                          />
                          <span className="text-sm">
                            {index === 0 ? 'Free (First episode)' : 'Free Episode'}
                          </span>
                        </label>

                        {!episode.isFree && index !== 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-yellow-500" />
                            <input
                              type="number"
                              value={episode.credits}
                              onChange={(e) => {
                                const updated = [...newEpisodes];
                                updated[index].credits = parseInt(e.target.value) || 0;
                                setNewEpisodes(updated);
                              }}
                              className="w-20 px-2 py-1 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                              min="0"
                            />
                            <span className="text-sm">credits</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewSeriesForm(false);
                  setNewSeriesTitle('');
                  setNewSeriesDescription('');
                  setNewEpisodes([]);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleNewSeriesSubmit}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
              >
                Create Series
              </button>
            </div>
          </div>
        )}

        {/* Existing Series List */}
        <div className="space-y-6">
          {series.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No series created yet</p>
            </div>
          ) : (
            series.map((s) => (
              <div key={s.id} className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Series Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedSeries(expandedSeries === s.id ? null : s.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedSeries === s.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <h2 className="text-xl font-bold">{s.title}</h2>
                          <p className="text-gray-400 text-sm mt-1">{s.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {s.episodes?.length || 0} episodes • Created {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteSeries(s.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Episode List */}
                {expandedSeries === s.id && (
                  <div className="border-t border-gray-800">
                    <div className="p-6">
                      {/* Series Banner Upload */}
                      <SeriesBannerUpload
                        seriesId={s.id}
                        currentBannerUrl={s.bannerUrl}
                        onBannerUploaded={(bannerUrl) => {
                          // Update the series state with the new banner URL
                          setSeries(prev => prev.map(series => 
                            series.id === s.id 
                              ? { ...series, bannerUrl } 
                              : series
                          ));
                        }}
                      />
                      
                      <div className="space-y-3">
                        {s.episodes?.map((episode) => (
                          <div key={episode.episodeId} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                                <div>
                                  <h4 className="font-semibold">
                                    Episode {episode.episodeNumber}: {episode.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                    <span>{episode.duration || 'N/A'}</span>
                                    <span className={episode.isFree || episode.episodeNumber === 1 ? 'text-green-500' : ''}>
                                      {episode.isFree || episode.episodeNumber === 1 ? 'Free' : `${episode.credits || 50} credits`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditEpisode(s.id, episode)}
                                  className="p-2 hover:bg-gray-700 rounded text-blue-500"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteEpisode(s.id, episode.episodeId)}
                                  className="p-2 hover:bg-gray-700 rounded text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* File Status */}
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className={`flex items-center gap-1 ${episode.videoPath ? 'text-green-500' : 'text-gray-500'}`}>
                                <FileVideo className="w-3 h-3" />
                                {episode.videoPath ? 'Video' : 'No video'}
                              </span>
                              <span className={`flex items-center gap-1 ${episode.audioPath ? 'text-green-500' : 'text-gray-500'}`}>
                                <FileAudio className="w-3 h-3" />
                                {episode.audioPath ? 'Audio' : 'No audio'}
                              </span>
                              <span className={`flex items-center gap-1 ${episode.thumbnailPath ? 'text-green-500' : 'text-gray-500'}`}>
                                <Image className="w-3 h-3" />
                                {episode.thumbnailPath ? 'Thumbnail' : 'No thumbnail'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          const formDiv = document.getElementById(`episode-form-${s.id}`);
                          if (formDiv) {
                            const currentDisplay = formDiv.style.display;
                            const newDisplay = currentDisplay === 'none' ? 'block' : 'none';
                            formDiv.style.display = newDisplay;
                            
                            // Quick fetch test
                            if (newDisplay === 'block') {
                              fetch('/api/auth/session')
                                .catch(err => console.error('❌ Fetch test failed:', err));
                            }
                          } else {
                            console.error('Form element not found!');
                          }
                        }}
                        type="button"
                        className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Episode
                      </button>

                      {/* Add/Edit Episode Form - shown below the button when clicked or when editing */}
                      <div style={{ display: editingEpisode?.seriesId === s.id ? 'block' : 'none' }} id={`episode-form-${s.id}`}>
                        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">
                              {editingEpisode?.seriesId === s.id ? 'Edit Episode' : 'Add New Episode'}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const formDiv = document.getElementById(`episode-form-${s.id}`);
                                if (formDiv) {
                                  formDiv.style.display = 'none';
                                }
                                setEditingEpisode(null);
                                setNewEpisodeNumber('');
                                setNewEpisodeTitle('');
                                setNewEpisodeDescription('');
                                setNewEpisodeDuration('');
                                setNewEpisodeCredits(50);
                                setNewEpisodeIsFree(false);
                                setNewEpisodeVideoFile(null);
                                setNewEpisodeAudioFile(null);
                                setNewEpisodeThumbnailFile(null);
                              }}
                              type="button"
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Episode Number (optional)</label>
                                <input
                                  type="number"
                                  value={newEpisodeNumber}
                                  onChange={(e) => setNewEpisodeNumber(e.target.value ? parseInt(e.target.value) : '')}
                                  className="w-full px-3 py-2 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                                  placeholder="Auto-generate if empty"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                  type="text"
                                  value={newEpisodeTitle}
                                onChange={(e) => setNewEpisodeTitle(e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                                  placeholder="Episode title"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Description</label>
                              <textarea
                                value={newEpisodeDescription}
                                onChange={(e) => setNewEpisodeDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-600 h-20"
                                placeholder="Episode description (optional)"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Duration</label>
                              <input
                                type="text"
                                value={newEpisodeDuration}
                                onChange={(e) => setNewEpisodeDuration(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                                placeholder="e.g., 45:00"
                              />
                            </div>

                            {/* File uploads */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <label className="block">
                                <span className="text-sm font-medium mb-1 block">Video File</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleVideoFileSelect(e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`video-${s.id}`}
                                />
                                <label
                                  htmlFor={`video-${s.id}`}
                                  className="bg-gray-600 rounded p-3 text-center cursor-pointer hover:bg-gray-500 block"
                                >
                                  <FileVideo className="w-6 h-6 mx-auto mb-1 text-red-600" />
                                  <span className="text-xs">
                                    {newEpisodeVideoFile ? (
                                      <>
                                        {newEpisodeVideoFile.name}
                                        <br />
                                        <span className="text-gray-400">{formatFileSize(newEpisodeVideoFile.size)}</span>
                                      </>
                                    ) : (editingEpisode?.seriesId === s.id ? 'Replace Video (optional)' : 'Choose Video')}
                                  </span>
                                </label>
                              </label>

                              <label className="block">
                                <span className="text-sm font-medium mb-1 block">Audio File</span>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleAudioFileSelect(e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`audio-${s.id}`}
                                />
                                <label
                                  htmlFor={`audio-${s.id}`}
                                  className="bg-gray-600 rounded p-3 text-center cursor-pointer hover:bg-gray-500 block"
                                >
                                  <FileAudio className="w-6 h-6 mx-auto mb-1 text-red-600" />
                                  <span className="text-xs">
                                    {newEpisodeAudioFile ? newEpisodeAudioFile.name : (editingEpisode?.seriesId === s.id ? 'Replace Audio (optional)' : 'Choose Audio')}
                                  </span>
                                </label>
                              </label>

                              <label className="block">
                                <span className="text-sm font-medium mb-1 block">Thumbnail</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleThumbnailFileSelect(e.target.files?.[0] || null)}
                                  className="hidden"
                                  id={`thumbnail-${s.id}`}
                                />
                                <label
                                  htmlFor={`thumbnail-${s.id}`}
                                  className="bg-gray-600 rounded p-3 text-center cursor-pointer hover:bg-gray-500 block"
                                >
                                  <Image className="w-6 h-6 mx-auto mb-1 text-red-600" />
                                  <span className="text-xs">
                                    {newEpisodeThumbnailFile ? newEpisodeThumbnailFile.name : (editingEpisode?.seriesId === s.id ? 'Replace Thumbnail (optional)' : 'Choose Thumbnail')}
                                  </span>
                                </label>
                              </label>
                            </div>

                            {/* Media Optimization Panel */}
                            {(newEpisodeVideoFile || newEpisodeAudioFile) && (
                              <MediaOptimizationPanel
                                videoFile={newEpisodeVideoFile}
                                audioFile={newEpisodeAudioFile}
                                videoValidation={videoValidation}
                                audioValidation={audioValidation}
                              />
                            )}

                            {/* Monetization */}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={newEpisodeIsFree}
                                  onChange={(e) => setNewEpisodeIsFree(e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Free Episode</span>
                              </label>

                              {!newEpisodeIsFree && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-yellow-500" />
                                  <input
                                    type="number"
                                    value={newEpisodeCredits}
                                    onChange={(e) => setNewEpisodeCredits(parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                                    min="0"
                                  />
                                  <span className="text-sm">credits</span>
                                </div>
                              )}
                            </div>

                            {/* Submit buttons */}
                            <div className="flex justify-end gap-2 mt-4">
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const res = await fetch('/api/test-episode', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ test: true })
                                    });
                                    const data = await res.json();
                                  } catch (error) {
                                    console.error('🧪 Test API error:', error);
                                  }
                                }}
                                type="button"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
                              >
                                Test API
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const formDiv = document.getElementById(`episode-form-${s.id}`);
                                  if (formDiv && !editingEpisode) {
                                    formDiv.style.display = 'none';
                                  }
                                  setEditingEpisode(null);
                                  setNewEpisodeNumber('');
                                  setNewEpisodeTitle('');
                                  setNewEpisodeDescription('');
                                  setNewEpisodeDuration('');
                                  setNewEpisodeCredits(50);
                                  setNewEpisodeIsFree(false);
                                  setNewEpisodeVideoFile(null);
                                  setNewEpisodeAudioFile(null);
                                  setNewEpisodeThumbnailFile(null);
                                }}
                                type="button"
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (editingEpisode?.seriesId === s.id) {
                                    handleUpdateEpisode();
                                  } else {
                                    handleAddEpisode(s.id);
                                  }
                                }}
                                type="button"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                              >
                                {editingEpisode?.seriesId === s.id ? 'Update Episode' : 'Submit Episode'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      
      {/* Upload Progress Modal */}
      <UploadProgress
        isUploading={uploadStatus !== 'idle'}
        progress={uploadProgress}
        status={uploadStatus}
        fileName={currentUploadFile}
        error={uploadError}
      />
    </div>
  );
}