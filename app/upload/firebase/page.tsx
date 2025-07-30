'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';

export default function FirebaseUploadPage() {
  const router = useRouter();
  const [seriesId, setSeriesId] = useState('');
  const [episodeData, setEpisodeData] = useState({
    episodeNumber: 1,
    title: '',
    description: '',
    credits: 50,
    isFree: false
  });
  const [files, setFiles] = useState({
    video: null as File | null,
    audio: null as File | null,
    thumbnail: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (type: 'video' | 'audio' | 'thumbnail', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const uploadToFirebase = async (file: File, type: string) => {
    // Get signed URL from Firebase
    const response = await fetch('/api/upload/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get ${type} upload URL`);
    }

    const { uploadUrl, fields, filePath, publicUrl } = await response.json();

    // Upload directly to Firebase
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', file);

    const uploadResult = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadResult.ok) {
      throw new Error(`Failed to upload ${type} to Firebase`);
    }

    // Verify upload
    const verifyResponse = await fetch(`/api/upload/firebase?filePath=${encodeURIComponent(filePath)}`);
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify ${type} upload`);
    }

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seriesId || !files.video || !episodeData.title) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');
    setStatus('Starting upload...');

    try {
      // Upload video
      setStatus('Uploading video to Firebase...');
      const videoUrl = await uploadToFirebase(files.video, 'video');
      
      // Upload audio if provided
      let audioUrl = '';
      if (files.audio) {
        setStatus('Uploading audio to Firebase...');
        audioUrl = await uploadToFirebase(files.audio, 'audio');
      }

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (files.thumbnail) {
        setStatus('Uploading thumbnail to Firebase...');
        thumbnailUrl = await uploadToFirebase(files.thumbnail, 'thumbnail');
      }

      // Create episode with Firebase URLs
      setStatus('Creating episode...');
      const createResponse = await fetch(`/api/content/${seriesId}/episode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeData: {
            ...episodeData,
            videoUrl,
            audioUrl,
            thumbnailUrl,
            duration: '00:00' // Will be calculated server-side
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create episode');
      }

      setStatus('Upload complete!');
      setTimeout(() => {
        router.push('/manage');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/manage" 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Manage
            </Link>
            <PremiumLogo />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Firebase Direct Upload</h1>
          <p className="text-gray-400 mb-6">
            This uploader bypasses Vercel limits by uploading directly to Firebase Storage.
            Files of any size can be uploaded.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Series ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Series ID *</label>
              <input
                type="text"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2"
                placeholder="e.g., series-1234567890"
                required
              />
            </div>

            {/* Episode Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Episode Number *</label>
                <input
                  type="number"
                  value={episodeData.episodeNumber}
                  onChange={(e) => setEpisodeData(prev => ({ ...prev, episodeNumber: parseInt(e.target.value) }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Credits</label>
                <input
                  type="number"
                  value={episodeData.credits}
                  onChange={(e) => setEpisodeData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={episodeData.title}
                onChange={(e) => setEpisodeData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={episodeData.description}
                onChange={(e) => setEpisodeData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2"
                rows={3}
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Video File * (Any size)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileSelect('video', e.target.files?.[0] || null)}
                  className="w-full"
                  required
                />
                {files.video && (
                  <p className="text-sm text-gray-400 mt-1">
                    {files.video.name} ({(files.video.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Audio File (Optional)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileSelect('audio', e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect('thumbnail', e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={episodeData.isFree}
                  onChange={(e) => setEpisodeData(prev => ({ ...prev, isFree: e.target.checked }))}
                  className="rounded"
                />
                <span>Free Episode</span>
              </label>
            </div>

            {/* Status Messages */}
            {status && (
              <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <Upload className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="text-sm">{status}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className={`
                w-full py-3 rounded-lg font-medium transition-all
                ${uploading 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'}
              `}
            >
              {uploading ? 'Uploading...' : 'Upload Episode'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}