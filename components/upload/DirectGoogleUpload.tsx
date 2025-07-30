'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DirectGoogleUploadProps {
  onUploadComplete: (url: string, filePath: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function DirectGoogleUpload({ 
  onUploadComplete, 
  accept = 'video/*',
  maxSizeMB = 10000 // 10GB default
}: DirectGoogleUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File size ${sizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setSuccess(false);
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get signed upload URL from your API
      const response = await fetch('/api/upload/gcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, filePath, publicUrl } = await response.json();

      // Step 2: Upload directly to Google Cloud Storage
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 204) {
          setSuccess(true);
          
          // Verify upload and get streaming URL
          const streamResponse = await fetch(`/api/upload/gcs?filePath=${encodeURIComponent(filePath)}&action=stream`);
          if (streamResponse.ok) {
            const { streamingUrl } = await streamResponse.json();
            onUploadComplete(streamingUrl, filePath);
          } else {
            onUploadComplete(publicUrl, filePath);
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="gcs-upload"
        />
        <label
          htmlFor="gcs-upload"
          className={`
            flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg
            ${uploading ? 'border-gray-500 bg-gray-900 cursor-not-allowed' : 'border-gray-600 hover:border-gray-500 cursor-pointer'}
            transition-colors
          `}
        >
          <Upload className="w-6 h-6" />
          <span>
            {uploading ? 'Uploading...' : 'Select file to upload (up to 10GB)'}
          </span>
        </label>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            Direct upload to Google Cloud Storage - no server limitations
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-400">Upload complete!</span>
        </div>
      )}
    </div>
  );
}