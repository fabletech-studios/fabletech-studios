'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomVideoPlayer from './CustomVideoPlayer';
import { useContentProtection } from '@/hooks/useContentProtection';
import { Shield } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

interface Episode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  videoPath: string;
  audioPath: string;
  duration?: string;
}

interface EnhancedVideoPlayerProps {
  episode: Episode;
  series: {
    id: string;
    title: string;
    episodes: Episode[];
  };
  onEpisodeChange?: (episodeId: string) => void;
}

export default function EnhancedVideoPlayer({
  episode,
  series,
  onEpisodeChange
}: EnhancedVideoPlayerProps) {
  const { customer } = useFirebaseCustomerAuth();
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState(0);
  
  // Rotating watermark positions
  const watermarkPositions = [
    'top-4 left-4',
    'top-4 right-4',
    'bottom-4 left-4',
    'bottom-4 right-4'
  ];

  // Content protection - balanced for better UX
  useContentProtection({
    disableRightClick: true, // Keep this for passive protection
    detectDevTools: false, // Disabled for better UX
    detectScreenRecording: false, // Disabled for better UX
    onViolation: (type) => {
      setViolationType(type);
      setShowViolationWarning(true);
      setTimeout(() => setShowViolationWarning(false), 3000); // Reduced to 3 seconds
      
      // Log violation attempt
      if (customer) {
        fetch('/api/security/log-violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: customer.uid,
            violationType: type,
            contentId: episode.episodeId,
            timestamp: new Date().toISOString()
          })
        });
      }
    }
  });

  // Rotate watermark position every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition(prev => (prev + 1) % watermarkPositions.length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate professional watermark text
  const getWatermarkText = () => {
    return 'FableTech Studios';
  };

  // Find next episode
  const currentIndex = series.episodes.findIndex(ep => ep.episodeId === episode.episodeId);
  const nextEpisode = currentIndex < series.episodes.length - 1 ? series.episodes[currentIndex + 1] : null;

  // Handle episode end
  const handleEpisodeEnd = () => {
    if (nextEpisode && onEpisodeChange) {
      // Auto-advance to next episode immediately when clicked or after countdown
      onEpisodeChange(nextEpisode.episodeId);
    }
  };

  return (
    <div className="relative">
      {/* Protection Warning - Small, non-intrusive notification */}
      <AnimatePresence>
        {showViolationWarning && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-4 right-4 z-50 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 text-sm max-w-xs"
            onClick={() => setShowViolationWarning(false)}
          >
            <Shield className="w-4 h-4 text-gray-400" />
            <p className="text-gray-300">
              Content protected
            </p>
            <button 
              className="ml-2 text-gray-500 hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowViolationWarning(false);
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player with Dynamic Watermark */}
      <div className="relative">
        <CustomVideoPlayer
          src={episode.videoPath}
          episodeTitle={episode.title}
          seriesTitle={series.title}
          episodeId={episode.episodeId}
          seriesId={series.id}
          onEnded={handleEpisodeEnd}
          nextEpisodeId={nextEpisode?.episodeId}
          watermarkText={getWatermarkText()}
          className="w-full aspect-video"
          hideTitle={true}
        />
        
        {/* Additional Dynamic Watermark - Made more subtle */}
        <motion.div
          key={watermarkPosition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }} // Reduced opacity
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute ${watermarkPositions[watermarkPosition]} pointer-events-none select-none`}
        >
          <div className="flex items-center gap-1 text-white/20"> {/* More subtle color */}
            <span className="text-[10px] font-medium">© 2025 FableTech Studios</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}