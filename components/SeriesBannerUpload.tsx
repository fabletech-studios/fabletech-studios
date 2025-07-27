'use client';

import { useState } from 'react';
import { Upload, Image, X, Eye, AlertCircle } from 'lucide-react';

interface SeriesBannerUploadProps {
  seriesId: string;
  currentBannerUrl?: string;
  onBannerUploaded: (bannerUrl: string) => void;
}

export default function SeriesBannerUpload({ 
  seriesId, 
  currentBannerUrl,
  onBannerUploaded 
}: SeriesBannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCurrentBanner, setShowCurrentBanner] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadBanner = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', selectedFile);
      formData.append('seriesId', seriesId);

      const response = await fetch('/api/series/banner', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        onBannerUploaded(data.bannerUrl);
        setSelectedFile(null);
        setPreview(null);
        alert('Banner uploaded successfully!');
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Image className="w-5 h-5" />
        Series Banner
      </h4>

      {/* Recommended Size Notice */}
      <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-300">
          <p>Recommended banner size: <strong>1920 x 600 pixels</strong></p>
          <p className="text-xs text-blue-400 mt-1">
            High-quality banners create an immersive Netflix-style experience
          </p>
        </div>
      </div>

      {/* Current Banner Preview */}
      {currentBannerUrl && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Banner:</span>
            <button
              onClick={() => setShowCurrentBanner(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Eye className="w-3 h-3" />
              View Current
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : preview 
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-600 hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Banner preview" 
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-400 mb-1">
              Drag and drop your banner image here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              JPG or PNG, up to 10MB
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`banner-upload-${seriesId}`}
            />
            <label
              htmlFor={`banner-upload-${seriesId}`}
              className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors"
            >
              Select Image
            </label>
          </>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && (
        <button
          onClick={uploadBanner}
          disabled={uploading}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Banner'}
        </button>
      )}

      {/* Current Banner Modal */}
      {showCurrentBanner && currentBannerUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCurrentBanner(false)}
        >
          <div className="relative max-w-5xl w-full">
            <img 
              src={currentBannerUrl} 
              alt="Current banner" 
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setShowCurrentBanner(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}