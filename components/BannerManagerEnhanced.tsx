'use client';

import { useState, useEffect } from 'react';
import { Upload, Image, RotateCcw, Eye, X, AlertCircle, Video, Monitor, Smartphone, Check } from 'lucide-react';

interface BannerSettings {
  type: 'gradient' | 'custom' | 'video';
  url?: string;
  filename?: string;
  uploadedAt?: string;
  size?: number;
  videoUrl?: string;
  mobileVideoUrl?: string;
  mobileImageUrl?: string;
}

export default function BannerManagerEnhanced() {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  
  // Image upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedMobileImageFile, setSelectedMobileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);
  
  // Video upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedMobileVideoFile, setSelectedMobileVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [mobileVideoPreview, setMobileVideoPreview] = useState<string | null>(null);
  
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchBannerSettings();
  }, []);

  const fetchBannerSettings = async () => {
    try {
      const response = await fetch('/api/banner/upload-enhanced');
      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.banner);
        if (data.banner?.type === 'video') {
          setActiveTab('video');
        }
      }
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = (file: File, isMobile = false) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    if (isMobile) {
      setSelectedMobileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMobileImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileSelect = (file: File, isMobile = false) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file (MP4 recommended)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size must be less than 50MB');
      return;
    }

    const url = URL.createObjectURL(file);
    
    if (isMobile) {
      setSelectedMobileVideoFile(file);
      setMobileVideoPreview(url);
    } else {
      setSelectedVideoFile(file);
      setVideoPreview(url);
    }
  };

  const uploadBanner = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      if (activeTab === 'image') {
        if (!selectedImageFile) {
          alert('Please select a desktop image');
          return;
        }
        formData.append('type', 'custom');
        formData.append('banner', selectedImageFile);
        if (selectedMobileImageFile) {
          formData.append('mobileBanner', selectedMobileImageFile);
        }
      } else {
        if (!selectedVideoFile) {
          alert('Please select a desktop video');
          return;
        }
        formData.append('type', 'video');
        formData.append('desktopVideo', selectedVideoFile);
        if (selectedMobileVideoFile) {
          formData.append('mobileVideo', selectedMobileVideoFile);
        }
      }

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/banner/upload-enhanced', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.settings || data.banner);
        // Reset all states
        setSelectedImageFile(null);
        setSelectedMobileImageFile(null);
        setSelectedVideoFile(null);
        setSelectedMobileVideoFile(null);
        setImagePreview(null);
        setMobileImagePreview(null);
        setVideoPreview(null);
        setMobileVideoPreview(null);
        alert('Banner uploaded successfully!');
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

      const response = await fetch('/api/banner/upload-enhanced', {
        method: 'DELETE',
        headers
      });

      const data = await response.json();
      if (data.success) {
        setBannerSettings(data.banner);
        alert('Banner reset to default gradient!');
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
      <div className="bg-black/50 backdrop-blur rounded-xl p-6 border border-purple-900/20">
        <h3 className="text-xl font-bold mb-4">Homepage Banner</h3>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-6 border border-purple-900/20">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Image className="w-6 h-6 text-purple-500" />
        Homepage Banner Manager
      </h3>

      {/* Current Banner Status */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Current Banner:</span>
          {(bannerSettings?.type === 'custom' || bannerSettings?.type === 'video') && (
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
        ) : bannerSettings?.type === 'video' ? (
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400">Video Banner Active</span>
            {bannerSettings.mobileVideoUrl && (
              <span className="text-xs text-gray-500">(+ Mobile Version)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Image className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Custom Image: {bannerSettings?.filename}</span>
            {bannerSettings?.mobileImageUrl && (
              <span className="text-xs text-gray-500">(+ Mobile Version)</span>
            )}
          </div>
        )}
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'image'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Image className="w-4 h-4" />
          Image Banner
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'video'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Video className="w-4 h-4" />
          Video Banner
        </button>
      </div>

      {/* Upload Areas */}
      {activeTab === 'image' ? (
        <div className="space-y-4">
          {/* Desktop Image */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Desktop Image (1920x600)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-500/10' : 
                selectedImageFile ? 'border-green-500 bg-green-500/10' : 
                'border-gray-600 bg-gray-900/50'
              }`}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleImageFileSelect(file);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Drop image or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileSelect(file);
                    }}
                    className="hidden"
                    id="desktop-image"
                  />
                  <label htmlFor="desktop-image" className="inline-block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer text-sm">
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Mobile Image */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile Image (Optional - 9:16 aspect ratio)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center bg-gray-900/50">
              {mobileImagePreview ? (
                <div className="relative">
                  <img src={mobileImagePreview} alt="Mobile preview" className="w-full h-32 object-cover rounded-lg" />
                  <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Mobile image (optional)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileSelect(file, true);
                    }}
                    className="hidden"
                    id="mobile-image"
                  />
                  <label htmlFor="mobile-image" className="inline-block mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer text-sm">
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Video */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Desktop Video (1920x600, MP4)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center bg-gray-900/50">
              {videoPreview ? (
                <div className="relative">
                  <video src={videoPreview} className="w-full h-32 object-cover rounded-lg" autoPlay loop muted />
                  <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <>
                  <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Drop video or click to browse</p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoFileSelect(file);
                    }}
                    className="hidden"
                    id="desktop-video"
                  />
                  <label htmlFor="desktop-video" className="inline-block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer text-sm">
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Mobile Video */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile Video (Optional - 9:16 aspect ratio)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center bg-gray-900/50">
              {mobileVideoPreview ? (
                <div className="relative">
                  <video src={mobileVideoPreview} className="w-full h-32 object-cover rounded-lg" autoPlay loop muted />
                  <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <>
                  <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Mobile video (optional)</p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoFileSelect(file, true);
                    }}
                    className="hidden"
                    id="mobile-video"
                  />
                  <label htmlFor="mobile-video" className="inline-block mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer text-sm">
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-xs space-y-1">
            {activeTab === 'video' ? (
              <>
                <p className="font-medium text-blue-400">Video Requirements:</p>
                <ul className="text-gray-400 space-y-1">
                  <li>• MP4 format recommended, max 50MB</li>
                  <li>• Will auto-loop and mute for best UX</li>
                  <li>• Mobile version optional (uses desktop if not provided)</li>
                  <li>• Ensure good contrast for text overlay</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium text-blue-400">Image Requirements:</p>
                <ul className="text-gray-400 space-y-1">
                  <li>• JPG/PNG format, max 10MB</li>
                  <li>• Recommended: 1920x600px for desktop</li>
                  <li>• Mobile version optional (uses desktop if not provided)</li>
                  <li>• Dark overlay will be applied for text readability</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={uploadBanner}
          disabled={uploading || (!selectedImageFile && !selectedVideoFile)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all"
        >
          {uploading ? 'Uploading...' : 'Upload Banner'}
        </button>
        
        {(bannerSettings?.type === 'custom' || bannerSettings?.type === 'video') && (
          <button
            onClick={resetToGradient}
            disabled={uploading}
            className="px-6 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-700/30 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && bannerSettings && (bannerSettings.type === 'custom' || bannerSettings.type === 'video') && (
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
                {bannerSettings.type === 'video' ? (
                  <video
                    src={bannerSettings.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={bannerSettings.url}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                )}
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