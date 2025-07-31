'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Upload, ArrowLeft, Plus, Trash2, FileVideo, FileAudio, 
  Image, CheckCircle, AlertCircle, Loader2, BookOpen
} from 'lucide-react';
import { validateVideoFile, validateAudioFile, validateImageFile, formatFileSize } from '@/lib/file-validation';
import { useNotifications } from '@/hooks/useNotifications';

interface Episode {
  episodeNumber: number;
  title: string;
  description: string;
  videoFile: File | null;
  audioFile: File | null;
  thumbnailFile: File | null;
  duration: string;
  credits: number;
  isFree: boolean;
}

interface Series {
  id: string;
  title: string;
  description: string;
}

interface SeriesTemplate {
  id: string;
  name: string;
  author: string;
  genre: string;
  descriptionTemplate: string;
  defaultCredits: number;
  tags: string[];
}

const DEFAULT_TEMPLATES: SeriesTemplate[] = [
  {
    id: 'fantasy',
    name: 'Fantasy Audiobook',
    author: '',
    genre: 'Fantasy',
    descriptionTemplate: 'An epic fantasy tale of {description}',
    defaultCredits: 50,
    tags: ['fantasy', 'adventure', 'magic']
  },
  {
    id: 'scifi',
    name: 'Science Fiction',
    author: '',
    genre: 'Science Fiction',
    descriptionTemplate: 'A thrilling sci-fi adventure: {description}',
    defaultCredits: 50,
    tags: ['sci-fi', 'future', 'technology']
  },
  {
    id: 'mystery',
    name: 'Mystery/Thriller',
    author: '',
    genre: 'Mystery',
    descriptionTemplate: 'A gripping mystery: {description}',
    defaultCredits: 40,
    tags: ['mystery', 'thriller', 'suspense']
  },
  {
    id: 'business',
    name: 'Business/Self-Help',
    author: '',
    genre: 'Business',
    descriptionTemplate: 'Transform your business with: {description}',
    defaultCredits: 75,
    tags: ['business', 'self-help', 'professional']
  }
];

export default function BulkUploadPage() {
  const router = useRouter();
  const notify = useNotifications();
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<any | null>(null);
  const [existingEpisodes, setExistingEpisodes] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SeriesTemplate | null>(null);
  const [customTemplates, setCustomTemplates] = useState<SeriesTemplate[]>([]);
  
  // Series form
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [seriesAuthor, setSeriesAuthor] = useState('');
  const [seriesGenre, setSeriesGenre] = useState('');
  
  // Episodes
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [startEpisodeNumber, setStartEpisodeNumber] = useState(1);
  const [episodeNumberGap, setEpisodeNumberGap] = useState(1);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploadResults, setUploadResults] = useState<{index: number; success: boolean; error?: string}[]>([]);

  useEffect(() => {
    loadSeries();
    loadCustomTemplates();
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
    }
  };

  const handleSeriesSelection = async (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    
    if (!seriesId) {
      setSelectedSeries(null);
      setExistingEpisodes([]);
      setStartEpisodeNumber(1);
      return;
    }

    // Find and load the selected series
    const selected = series.find(s => s.id === seriesId) as any;
    if (selected) {
      setSelectedSeries(selected);
      const episodes = selected.episodes || [];
      setExistingEpisodes(episodes);
      
      // Calculate next available episode number
      const existingNumbers = episodes.map((ep: any) => ep.episodeNumber);
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      setStartEpisodeNumber(nextNumber);
    }
  };

  const loadCustomTemplates = () => {
    const saved = localStorage.getItem('seriesTemplates');
    if (saved) {
      setCustomTemplates(JSON.parse(saved));
    }
  };

  const saveAsTemplate = () => {
    if (!seriesTitle || !seriesAuthor || !seriesGenre) {
      notify.warning('Missing Information', 'Please fill in series title, author, and genre to save as template');
      return;
    }

    const newTemplate: SeriesTemplate = {
      id: `custom-${Date.now()}`,
      name: seriesTitle,
      author: seriesAuthor,
      genre: seriesGenre,
      descriptionTemplate: seriesDescription,
      defaultCredits: episodes[0]?.credits || 50,
      tags: []
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('seriesTemplates', JSON.stringify(updated));
    notify.success('Template Saved', 'Your series template has been saved successfully');
  };

  const applyTemplate = (template: SeriesTemplate) => {
    setSelectedTemplate(template);
    setSeriesAuthor(template.author);
    setSeriesGenre(template.genre);
    if (template.descriptionTemplate && !seriesDescription) {
      setSeriesDescription(template.descriptionTemplate.replace('{description}', ''));
    }
  };

  const addEpisode = () => {
    const episodeNumber = startEpisodeNumber + (episodes.length * episodeNumberGap);
    
    // Check for conflicts with existing episodes
    const existingNumbers = existingEpisodes.map(ep => ep.episodeNumber);
    if (existingNumbers.includes(episodeNumber)) {
      notify.error('Episode Conflict', `Episode ${episodeNumber} already exists in this series. Please adjust your starting episode number or gap.`);
      return;
    }
    
    // Check for conflicts with pending episodes
    const pendingNumbers = episodes.map(ep => ep.episodeNumber);
    if (pendingNumbers.includes(episodeNumber)) {
      notify.warning('Duplicate Episode', `Episode ${episodeNumber} is already in your upload queue`);
      return;
    }
    
    setEpisodes([...episodes, {
      episodeNumber,
      title: '',
      description: '',
      videoFile: null,
      audioFile: null,
      thumbnailFile: null,
      duration: '',
      credits: selectedTemplate?.defaultCredits || 50,
      isFree: episodes.length === 0 && existingEpisodes.length === 0 // First episode free only if no existing episodes
    }]);
  };

  const removeEpisode = (index: number) => {
    setEpisodes(episodes.filter((_, i) => i !== index));
  };

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const updated = [...episodes];
    updated[index] = { ...updated[index], [field]: value };
    setEpisodes(updated);
  };

  const handleFileSelect = (index: number, type: 'video' | 'audio' | 'thumbnail', file: File | null) => {
    if (!file) {
      updateEpisode(index, `${type}File`, null);
      return;
    }

    let validation;
    switch (type) {
      case 'video':
        validation = validateVideoFile(file);
        break;
      case 'audio':
        validation = validateAudioFile(file);
        break;
      case 'thumbnail':
        validation = validateImageFile(file);
        break;
    }

    if (!validation.valid) {
      notify.error('Invalid File', validation.error);
      return;
    }

    updateEpisode(index, `${type}File`, file);
  };

  const handleBulkUpload = async () => {
    // Validation
    if (!selectedSeriesId && (!seriesTitle || !seriesDescription)) {
      notify.warning('Series Required', 'Please select an existing series or provide new series details');
      return;
    }

    if (episodes.length === 0) {
      notify.warning('No Episodes', 'Please add at least one episode to upload');
      return;
    }

    const invalidEpisodes = episodes.filter((ep, i) => 
      !ep.title || (!ep.videoFile && !ep.audioFile)
    );

    if (invalidEpisodes.length > 0) {
      notify.warning('Incomplete Episodes', 'All episodes must have a title and at least one media file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
    setUploadResults([]);

    let targetSeriesId = selectedSeriesId;

    // Create new series if needed
    if (!selectedSeriesId) {
      try {
        const seriesData = {
          title: seriesTitle,
          description: seriesDescription,
          author: seriesAuthor,
          genre: seriesGenre
        };

        const res = await fetch('/api/series/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seriesData)
        });

        if (!res.ok) {
          throw new Error('Failed to create series');
        }

        const data = await res.json();
        targetSeriesId = data.seriesId;
      } catch (error) {
        console.error('Error creating series:', error);
        notify.error('Series Creation Failed', 'Could not create the new series');
        setUploading(false);
        return;
      }
    }

    // Upload episodes one by one
    for (let i = 0; i < episodes.length; i++) {
      setCurrentUploadIndex(i);
      const episode = episodes[i];

      const formData = new FormData();
      const episodeData = {
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        description: episode.description,
        duration: episode.duration,
        credits: episode.credits,
        isFree: episode.isFree
      };
      formData.append('episodeData', JSON.stringify(episodeData));

      if (episode.videoFile) formData.append('video', episode.videoFile);
      if (episode.audioFile) formData.append('audio', episode.audioFile);
      if (episode.thumbnailFile) formData.append('thumbnail', episode.thumbnailFile);

      try {
        // Check if any file is over 2MB (Vercel limit safety)
        const videoSize = episode.videoFile?.size || 0;
        const audioSize = episode.audioFile?.size || 0;
        const thumbnailSize = episode.thumbnailFile?.size || 0;
        const totalSize = videoSize + audioSize + thumbnailSize;
        const sizeMB = totalSize / (1024 * 1024);
        
        console.log(`Episode ${i + 1} - Checking file sizes...`);
        console.log(`Video: ${videoSize} bytes (${(videoSize / (1024 * 1024)).toFixed(2)}MB)`);
        console.log(`Audio: ${audioSize} bytes (${(audioSize / (1024 * 1024)).toFixed(2)}MB)`);
        console.log(`Thumbnail: ${thumbnailSize} bytes (${(thumbnailSize / (1024 * 1024)).toFixed(2)}MB)`);
        console.log(`Total: ${totalSize} bytes (${sizeMB.toFixed(2)}MB)`);

        const uploadPromise = new Promise<boolean>(async (resolve) => {
          // Use Firebase for anything over 2MB to be safe with Vercel limits
          if (sizeMB > 2) {
            // For large files, use Firebase direct upload
            console.log(`Episode ${i + 1} is ${sizeMB.toFixed(2)}MB - using direct Firebase upload`);
            notify.info('Large File Upload', `File is ${sizeMB.toFixed(2)}MB - using Firebase direct upload`);
            
            // First, get signed URLs from Firebase
            const uploadResponse = await fetch('/api/upload/firebase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: episode.videoFile?.name || 'video.mp4',
                contentType: episode.videoFile?.type || 'video/mp4',
                fileSize: episode.videoFile?.size || 0
              })
            });
            
            if (!uploadResponse.ok) {
              throw new Error('Failed to get upload URL');
            }
            
            const { uploadUrl, fields, filePath } = await uploadResponse.json();
            
            // Upload video directly to Firebase
            const uploadFormData = new FormData();
            Object.entries(fields).forEach(([key, value]) => {
              uploadFormData.append(key, value as string);
            });
            uploadFormData.append('file', episode.videoFile!);
            
            const uploadResult = await fetch(uploadUrl, {
              method: 'POST',
              body: uploadFormData
            });
            
            if (!uploadResult.ok) {
              throw new Error('Failed to upload to Firebase');
            }
            
            // Now create episode with Firebase URL
            const episodeData = {
              ...episode,
              videoUrl: filePath, // Use Firebase path instead of file
              videoFile: undefined // Don't send the file
            };
            
            const createResponse = await fetch(`/api/content/${targetSeriesId}/episode`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ episodeData })
            });
            
            if (!createResponse.ok) {
              throw new Error('Failed to create episode');
            }
            
            setUploadResults(prev => [...prev, { index: i, success: true }]);
            resolve(true);
          } else {
            // For small files, use regular upload with XHR
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                const overallProgress = ((i / episodes.length) + (percentComplete / 100 / episodes.length)) * 100;
                setUploadProgress(Math.round(overallProgress));
              }
            });
            
            xhr.onload = () => {
              const success = xhr.status >= 200 && xhr.status < 300;
              setUploadResults(prev => [...prev, { index: i, success, error: success ? undefined : xhr.responseText }]);
              resolve(success);
            };
            
            xhr.onerror = () => {
              setUploadResults(prev => [...prev, { index: i, success: false, error: 'Network error' }]);
              resolve(false);
            };
            
            xhr.open('POST', `/api/content/${targetSeriesId}/episode`);
            xhr.send(formData);
          }
        });

        await uploadPromise;
      } catch (error) {
        console.error(`Error uploading episode ${i + 1}:`, error);
        setUploadResults(prev => [...prev, { index: i, success: false, error: String(error) }]);
      }
    }

    setUploading(false);
    setUploadProgress(100);

    // Check results
    const successCount = uploadResults.filter(r => r.success).length;
    if (successCount === episodes.length) {
      notify.success('Upload Complete', `All ${episodes.length} episodes uploaded successfully!`);
      router.push('/manage');
    } else {
      notify.warning('Partial Upload', `Uploaded ${successCount} of ${episodes.length} episodes. Some uploads failed.`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/manage" className="hover:text-gray-300">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-semibold">Bulk Episode Upload</h1>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Series Selection/Creation */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Series Information</h2>
          
          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Use Template</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {DEFAULT_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`p-3 rounded-lg text-sm ${
                    selectedTemplate?.id === template.id 
                      ? 'bg-red-600' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mx-auto mb-1" />
                  {template.name}
                </button>
              ))}
            </div>
            
            {customTemplates.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-2">Custom Templates</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {customTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={`p-3 rounded-lg text-sm ${
                        selectedTemplate?.id === template.id 
                          ? 'bg-red-600' 
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload to Existing Series</label>
              <select
                value={selectedSeriesId}
                onChange={(e) => handleSeriesSelection(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Create New Series</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({(s as any).episodes?.length || 0} episodes)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show existing episodes when series is selected */}
          {selectedSeries && existingEpisodes.length > 0 && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-yellow-400">⚠️ Existing Episodes in "{selectedSeries.title}"</h3>
              <div className="space-y-2">
                {existingEpisodes.map((episode) => (
                  <div key={episode.episodeId} className="flex items-center justify-between text-sm">
                    <span>
                      Episode {episode.episodeNumber}: {episode.title}
                      {episode.isFree && <span className="ml-2 text-green-400">(Free)</span>}
                    </span>
                    <span className="text-gray-400">
                      {episode.duration || 'N/A'} • {episode.credits || 0} credits
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                New episodes will start at Episode {startEpisodeNumber}
              </p>
            </div>
          )}

          {!selectedSeriesId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Series Title *</label>
                  <input
                    type="text"
                    value={seriesTitle}
                    onChange={(e) => setSeriesTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g., The Forgotten Kingdom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <input
                    type="text"
                    value={seriesAuthor}
                    onChange={(e) => setSeriesAuthor(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Genre</label>
                  <input
                    type="text"
                    value={seriesGenre}
                    onChange={(e) => setSeriesGenre(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g., Fantasy, Sci-Fi, Mystery"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={saveAsTemplate}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                  >
                    Save as Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Series Description *</label>
                <textarea
                  value={seriesDescription}
                  onChange={(e) => setSeriesDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 h-24"
                  placeholder="Enter series description..."
                />
              </div>
            </>
          )}
        </div>

        {/* Episode Settings */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Episode Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Starting Episode Number</label>
              <input
                type="number"
                value={startEpisodeNumber}
                onChange={(e) => setStartEpisodeNumber(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Episode Number Gap</label>
              <input
                type="number"
                value={episodeNumberGap}
                onChange={(e) => setEpisodeNumberGap(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                min="1"
              />
              <p className="text-xs text-gray-400 mt-1">Episodes will be numbered: {startEpisodeNumber}, {startEpisodeNumber + episodeNumberGap}, {startEpisodeNumber + (2 * episodeNumberGap)}...</p>
            </div>
          </div>
        </div>

        {/* Episodes */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Episodes ({episodes.length})</h2>
            <button
              onClick={addEpisode}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Episode
            </button>
          </div>

          {episodes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No episodes added yet</p>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Episode {episode.episodeNumber}</h3>
                    <button
                      onClick={() => removeEpisode(index)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        type="text"
                        value={episode.title}
                        onChange={(e) => updateEpisode(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                        placeholder="Episode title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration</label>
                      <input
                        type="text"
                        value={episode.duration}
                        onChange={(e) => updateEpisode(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                        placeholder="e.g., 45:00"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={episode.description}
                      onChange={(e) => updateEpisode(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600 h-20"
                      placeholder="Episode description (optional)"
                    />
                  </div>

                  {/* File uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="block">
                      <span className="text-sm font-medium mb-1 block">Video File</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileSelect(index, 'video', e.target.files?.[0] || null)}
                        className="hidden"
                        id={`video-${index}`}
                      />
                      <label
                        htmlFor={`video-${index}`}
                        className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600 block"
                      >
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
                      </label>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium mb-1 block">Audio File</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileSelect(index, 'audio', e.target.files?.[0] || null)}
                        className="hidden"
                        id={`audio-${index}`}
                      />
                      <label
                        htmlFor={`audio-${index}`}
                        className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600 block"
                      >
                        <FileAudio className="w-6 h-6 mx-auto mb-1 text-red-600" />
                        <span className="text-xs">
                          {episode.audioFile ? (
                            <>
                              {episode.audioFile.name}
                              <br />
                              <span className="text-gray-400">{formatFileSize(episode.audioFile.size)}</span>
                            </>
                          ) : 'Choose Audio'}
                        </span>
                      </label>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium mb-1 block">Thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(index, 'thumbnail', e.target.files?.[0] || null)}
                        className="hidden"
                        id={`thumbnail-${index}`}
                      />
                      <label
                        htmlFor={`thumbnail-${index}`}
                        className="bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600 block"
                      >
                        <Image className="w-6 h-6 mx-auto mb-1 text-red-600" />
                        <span className="text-xs">
                          {episode.thumbnailFile ? (
                            <>
                              {episode.thumbnailFile.name}
                              <br />
                              <span className="text-gray-400">{formatFileSize(episode.thumbnailFile.size)}</span>
                            </>
                          ) : 'Choose Thumbnail'}
                        </span>
                      </label>
                    </label>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={episode.isFree}
                        onChange={(e) => updateEpisode(index, 'isFree', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Free Episode</span>
                    </label>

                    {!episode.isFree && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Credits:</span>
                        <input
                          type="number"
                          value={episode.credits}
                          onChange={(e) => updateEpisode(index, 'credits', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload result indicator */}
                  {uploadResults.find(r => r.index === index) && (
                    <div className="mt-3">
                      {uploadResults.find(r => r.index === index)?.success ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Uploaded successfully</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Upload failed: {uploadResults.find(r => r.index === index)?.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Uploading Episodes</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Uploading episode {currentUploadIndex + 1} of {episodes.length}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/manage"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
          >
            Cancel
          </Link>
          <button
            onClick={handleBulkUpload}
            disabled={uploading || episodes.length === 0}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-semibold flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload {episodes.length} Episodes
          </button>
        </div>
      </main>
    </div>
  );
}