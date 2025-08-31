'use client';

import { useState, useRef } from 'react';
import { Upload, Video, Smartphone, Monitor, X, Check, AlertCircle } from 'lucide-react';

interface VideoBannerUploadProps {
  onSuccess?: () => void;
}

export default function VideoBannerUpload({ onSuccess }: VideoBannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState({
    desktop: '',
    mobile: ''
  });
  const [selectedType, setSelectedType] = useState<'video' | 'image'>('video');
  
  const desktopVideoRef = useRef<HTMLInputElement>(null);
  const mobileVideoRef = useRef<HTMLInputElement>(null);
  const desktopImageRef = useRef<HTMLInputElement>(null);
  const mobileImageRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, device: 'desktop' | 'mobile') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (selectedType === 'video') {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4 recommended)');
        return;
      }
      // Validate file size (max 50MB for videos)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file too large. Maximum size is 50MB.');
        return;
      }
    } else {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 10MB for images)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file too large. Maximum size is 10MB.');
        return;
      }
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => ({
      ...prev,
      [device]: url
    }));
  };

  const handleUpload = async () => {
    const desktopFile = selectedType === 'video' 
      ? desktopVideoRef.current?.files?.[0]
      : desktopImageRef.current?.files?.[0];
    
    const mobileFile = selectedType === 'video'
      ? mobileVideoRef.current?.files?.[0]
      : mobileImageRef.current?.files?.[0];

    if (!desktopFile) {
      alert(`Please select a desktop ${selectedType} file`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('type', selectedType);
      formData.append('desktopFile', desktopFile);
      if (mobileFile) {
        formData.append('mobileFile', mobileFile);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/banner/video-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        alert('Banner uploaded successfully!');
        onSuccess?.();
        
        // Reset form
        setPreviewUrls({ desktop: '', mobile: '' });
        if (desktopVideoRef.current) desktopVideoRef.current.value = '';
        if (mobileVideoRef.current) mobileVideoRef.current.value = '';
        if (desktopImageRef.current) desktopImageRef.current.value = '';
        if (mobileImageRef.current) mobileImageRef.current.value = '';
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload banner');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload banner');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearBanner = async () => {
    if (!confirm('Are you sure you want to remove the current banner?')) return;
    
    try {
      const response = await fetch('/api/banner/video-upload', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Banner removed successfully');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error removing banner:', error);
      alert('Failed to remove banner');
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-6 border border-purple-900/20">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Video className="w-6 h-6 text-purple-500" />
        Video Banner Settings
      </h3>

      {/* Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Banner Type</label>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedType('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedType === 'video'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Banner
          </button>
          <button
            onClick={() => setSelectedType('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedType === 'image'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Image Banner
          </button>
        </div>
      </div>

      {/* Desktop Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Desktop {selectedType === 'video' ? 'Video' : 'Image'} (1920x600)
        </label>
        <div className="relative">
          <input
            ref={selectedType === 'video' ? desktopVideoRef : desktopImageRef}
            type="file"
            accept={selectedType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
            onChange={(e) => handleFileSelect(e, 'desktop')}
            disabled={uploading}
            className="hidden"
            id="desktop-file"
          />
          <label
            htmlFor="desktop-file"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors cursor-pointer bg-gray-900/50"
          >
            {previewUrls.desktop ? (
              <div className="relative w-full h-full">
                {selectedType === 'video' ? (
                  <video
                    src={previewUrls.desktop}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={previewUrls.desktop}
                    alt="Desktop preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">
                  Click to upload desktop {selectedType}
                </span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Mobile Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Mobile {selectedType === 'video' ? 'Video' : 'Image'} (Optional - 9:16 aspect ratio)
        </label>
        <div className="relative">
          <input
            ref={selectedType === 'video' ? mobileVideoRef : mobileImageRef}
            type="file"
            accept={selectedType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
            onChange={(e) => handleFileSelect(e, 'mobile')}
            disabled={uploading}
            className="hidden"
            id="mobile-file"
          />
          <label
            htmlFor="mobile-file"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors cursor-pointer bg-gray-900/50"
          >
            {previewUrls.mobile ? (
              <div className="relative w-full h-full">
                {selectedType === 'video' ? (
                  <video
                    src={previewUrls.mobile}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={previewUrls.mobile}
                    alt="Mobile preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">
                  Click to upload mobile {selectedType} (optional)
                </span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Info Alert */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="mb-2">
              <strong>Video Requirements:</strong> MP4 format, max 50MB, will auto-loop and mute
            </p>
            <p className="mb-2">
              <strong>Image Requirements:</strong> JPG/PNG, max 10MB
            </p>
            <p>
              <strong>Mobile Version:</strong> If not provided, desktop version will be used on all devices
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Uploading...</span>
            <span className="text-purple-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleUpload}
          disabled={uploading || !previewUrls.desktop}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Banner
            </>
          )}
        </button>
        
        <button
          onClick={clearBanner}
          disabled={uploading}
          className="px-6 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-700/30 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Remove Banner
        </button>
      </div>
    </div>
  );
}