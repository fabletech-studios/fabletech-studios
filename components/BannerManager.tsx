'use client';

import { useState, useEffect } from 'react';
import { Upload, Image, RotateCcw, Eye, X, AlertCircle } from 'lucide-react';

interface BannerSettings {
  type: 'gradient' | 'custom';
  url?: string;
  filename?: string;
  uploadedAt?: string;
  size?: number;
}

export default function BannerManager() {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBannerSettings();
  }, []);

  const fetchBannerSettings = async () => {
    try {
      const response = await fetch('/api/banner/upload');
      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.banner);
      }
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
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

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/banner/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.settings);
        setSelectedFile(null);
        setPreview(null);
        alert('Banner uploaded successfully!');
        // Refresh the page to see changes
        window.location.reload();
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

  const resetToGradient = async () => {
    if (!confirm('Are you sure you want to reset to the default gradient banner?')) {
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/banner/upload', {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.banner);
        alert('Banner reset to default gradient!');
        // Refresh the page to see changes
        window.location.reload();
      } else {
        alert(`Reset failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Reset failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Homepage Banner
        </h3>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Image className="w-5 h-5" />
        Homepage Banner
      </h3>

      {/* Current Banner Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Current Banner:</span>
          {bannerSettings?.type === 'custom' && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          )}
        </div>
        
        {bannerSettings?.type === 'gradient' ? (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-gradient-to-r from-black via-black/50 to-transparent rounded"></div>
            <span>Default Gradient</span>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-green-400">Custom Image: {bannerSettings?.filename}</p>
            {bannerSettings?.size && (
              <p className="text-gray-500 text-xs">Size: {formatFileSize(bannerSettings.size)}</p>
            )}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : selectedFile
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-600 bg-gray-800/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="space-y-4">
            {preview && (
              <div className="max-w-md mx-auto">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <div>
              <p className="text-green-400 font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={uploadBanner}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg text-sm font-medium"
              >
                {uploading ? 'Uploading...' : 'Upload Banner'}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-500 mx-auto" />
            <div>
              <p className="text-lg font-medium">Upload Banner Image</p>
              <p className="text-sm text-gray-400 mt-1">
                Drop image here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 1920x600px, JPG/PNG, max 5MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="banner-upload"
            />
            <label
              htmlFor="banner-upload"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer text-sm font-medium"
            >
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Reset Button */}
      {bannerSettings?.type === 'custom' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={resetToGradient}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Gradient
          </button>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-medium text-blue-400">Banner Guidelines:</p>
            <ul className="text-gray-400 space-y-1">
              <li>• Use dark images or images with good text contrast areas</li>
              <li>• Banner will have a dark overlay to ensure text readability</li>
              <li>• Focus on storytelling, books, or atmospheric themes</li>
              <li>• Image will be responsive and may be cropped on mobile</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && bannerSettings?.url && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h4 className="font-semibold">Banner Preview</h4>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative aspect-[16/5] rounded-lg overflow-hidden">
                <img
                  src={bannerSettings.url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-start justify-start p-8 pt-16">
                  <div className="max-w-lg text-white">
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Welcome to FableTech Studios</h2>
                    <p className="text-xl mb-8 text-gray-200 drop-shadow-md">
                      Discover premium audiobook content and immersive storytelling experiences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}