'use client';

import { useState, useRef } from 'react';
import { Upload, Image, Music, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadVideo, uploadAudio, uploadThumbnail, type UploadProgress } from '@/lib/firebase/upload-service';

export default function FirebaseUploadTest() {
  const [uploadType, setUploadType] = useState<'video' | 'audio' | 'thumbnail'>('video');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(null);
    setResult(null);

    try {
      let uploadResult;
      
      if (uploadType === 'video') {
        uploadResult = await uploadVideo(
          file,
          'test-series-001',
          1,
          (progress) => setProgress(progress)
        );
      } else if (uploadType === 'audio') {
        uploadResult = await uploadAudio(
          file,
          'test-series-001',
          1,
          (progress) => setProgress(progress)
        );
      } else {
        uploadResult = await uploadThumbnail(
          file,
          'test-series-001',
          1
        );
        // Fake progress for thumbnail since it's not tracked
        setProgress({ progress: 100, state: 'success' });
      }

      if (uploadResult) {
        setResult(uploadResult);
      } else {
        setProgress({ progress: 0, state: 'error', error: 'Upload failed' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setProgress({ 
        progress: 0, 
        state: 'error', 
        error: error.message || 'Upload failed' 
      });
    } finally {
      setUploading(false);
    }
  };

  const getAcceptType = () => {
    switch (uploadType) {
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      case 'thumbnail':
        return 'image/*';
    }
  };

  const getIcon = () => {
    switch (uploadType) {
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'thumbnail':
        return <Image className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Storage Upload Test</h1>

        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-8">
          <p className="text-green-300">
            ✅ This demonstrates file uploads to Firebase Storage without authentication.
            Files are uploaded directly to storage buckets with public access.
          </p>
        </div>

        {/* Upload Type Selection */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Upload Type</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['video', 'audio', 'thumbnail'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setUploadType(type)}
                className={`p-4 rounded-lg capitalize transition-colors ${
                  uploadType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {type === 'video' && <Video className="w-8 h-8 mx-auto mb-2" />}
                {type === 'audio' && <Music className="w-8 h-8 mx-auto mb-2" />}
                {type === 'thumbnail' && <Image className="w-8 h-8 mx-auto mb-2" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload {uploadType}</h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptType()}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-4">
              {getIcon()}
              <p className="text-lg">
                {uploading ? 'Uploading...' : `Click to select ${uploadType} file`}
              </p>
              <p className="text-sm text-gray-400">
                {uploadType === 'video' && 'MP4, WebM, MOV'}
                {uploadType === 'audio' && 'MP3, M4A, WAV'}
                {uploadType === 'thumbnail' && 'JPG, PNG, WebP'}
              </p>
            </div>
          </button>

          {/* Progress Bar */}
          {progress && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">
                  {progress.state === 'running' && 'Uploading...'}
                  {progress.state === 'success' && 'Upload complete!'}
                  {progress.state === 'error' && 'Upload failed'}
                </span>
                <span className="text-sm">{Math.round(progress.progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress.state === 'error' ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-red-400 text-sm mt-2">{progress.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Upload Result */}
        {result && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Upload Successful
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">File Name:</span>{' '}
                <span className="text-white font-mono">{result.fileName}</span>
              </div>
              <div>
                <span className="text-gray-400">Size:</span>{' '}
                <span className="text-white">{(result.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-gray-400">Storage Path:</span>{' '}
                <span className="text-white font-mono text-xs">{result.fullPath}</span>
              </div>
              <div>
                <span className="text-gray-400">Download URL:</span>{' '}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs break-all"
                >
                  {result.url}
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center space-y-2">
          <a 
            href="/firebase-hybrid-mode"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            ← Back to Hybrid Mode
          </a>
          <br />
          <a 
            href="/firebase-content-test"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            View Content Management
          </a>
        </div>
      </div>
    </div>
  );
}