'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BannerSettings {
  type: 'gradient' | 'custom' | 'video';
  url?: string;
  videoUrl?: string;
  mobileVideoUrl?: string;
  mobileImageUrl?: string;
}

export default function HomepageBanner() {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({ type: 'gradient' });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchBannerSettings();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchBannerSettings = async () => {
    try {
      const response = await fetch('/api/banner/upload-enhanced');
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
  const showVideo = bannerSettings.type === 'video' && (bannerSettings.videoUrl || bannerSettings.mobileVideoUrl);

  // Determine which media to show based on device
  const getMediaUrl = () => {
    if (bannerSettings.type === 'video') {
      if (isMobile && bannerSettings.mobileVideoUrl) return bannerSettings.mobileVideoUrl;
      return bannerSettings.videoUrl;
    }
    if (bannerSettings.type === 'custom') {
      if (isMobile && bannerSettings.mobileImageUrl) return bannerSettings.mobileImageUrl;
      return bannerSettings.url;
    }
    return null;
  };

  return (
    <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Background - Video, Custom Image or Gradient */}
      {showVideo ? (
        <>
          {/* Video Background */}
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => {
                console.error('Video failed to load');
                setBannerSettings({ type: 'gradient' });
              }}
            >
              <source src={getMediaUrl() || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Loading placeholder while video loads */}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
          )}
        </>
      ) : showCustomImage ? (
        <>
          {/* Custom Image Background */}
          <div className="absolute inset-0">
            <img
              src={getMediaUrl() || bannerSettings.url}
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
      
      {/* Additional overlay for custom images/videos to ensure readability */}
      {(showCustomImage || showVideo) && (
        <div className="absolute inset-0 bg-black/30 z-15" />
      )}

      {/* Content - Positioned in left area to avoid banner graphics */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start justify-start pt-16 lg:pt-20">
        <motion.div 
          className="max-w-lg lg:max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4" />
              Premium Content Available
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white drop-shadow-lg font-poppins"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Welcome to FableTech Studios
          </motion.h2>
          
          <motion.p 
            className="text-lg lg:text-xl mb-6 lg:mb-8 text-gray-200 drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover premium audiobook content and immersive storytelling experiences.
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Primary CTA - Start Listening */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <Link
                href="/browse"
                className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 lg:px-10 py-3 lg:py-4 rounded-xl font-semibold flex items-center gap-3 text-sm lg:text-base transition-all shadow-xl group"
              >
                {/* Animated background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                {/* Content */}
                <span className="relative z-10 flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" />
                  </motion.div>
                  Start Listening
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </motion.div>
                </span>
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 -top-2 -bottom-2"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <div className="h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </motion.div>
              </Link>
              
              {/* Glow effect */}
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-700 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300"
              />
            </motion.div>
            
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle bottom gradient for better transition to content */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent z-10" />
    </section>
  );
}