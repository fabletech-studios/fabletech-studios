'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

interface BannerSettings {
  type: 'gradient' | 'custom';
  url?: string;
}

export default function HomepageBanner() {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({ type: 'gradient' });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchBannerSettings();
  }, []);

  const fetchBannerSettings = async () => {
    try {
      const response = await fetch('/api/banner/upload');
      const data = await response.json();
      if (data.success && data.banner) {
        setBannerSettings(data.banner);
      }
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
      // Fall back to gradient on error
      setBannerSettings({ type: 'gradient' });
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    // Fall back to gradient on image load error
    setBannerSettings({ type: 'gradient' });
  };

  const showCustomImage = bannerSettings.type === 'custom' && bannerSettings.url && !imageError;

  return (
    <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Background - Custom Image or Gradient */}
      {showCustomImage ? (
        <>
          {/* Custom Image Background */}
          <div className="absolute inset-0">
            <img
              src={bannerSettings.url}
              alt="Homepage banner"
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
          
          {/* Loading placeholder while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
          )}
        </>
      ) : (
        /* Default Gradient Background */
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
      
      {/* Additional overlay for custom images to ensure readability */}
      {showCustomImage && (
        <div className="absolute inset-0 bg-black/30 z-15" />
      )}

      {/* Content - Positioned in left area to avoid banner graphics */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start justify-start pt-16 lg:pt-20">
        <div className="max-w-lg lg:max-w-xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white drop-shadow-lg">
            Welcome to FableTech Studios
          </h2>
          <p className="text-lg lg:text-xl mb-6 lg:mb-8 text-gray-200 drop-shadow-md">
            Discover premium audiobook content and immersive storytelling experiences.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/browse"
              className="bg-red-600 hover:bg-red-700 px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-semibold flex items-center gap-2 text-sm lg:text-base transition-colors shadow-lg"
            >
              <Play className="w-4 h-4 lg:w-5 lg:h-5" /> Start Listening
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient for better transition to content */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent z-10" />
    </section>
  );
}