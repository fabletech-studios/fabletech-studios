'use client';

import { useState, useEffect, useRef } from 'react';
import { ContentProtectionManager } from '@/lib/content-protection/protection-manager';
import ProtectionOverlay from '@/components/ProtectionOverlay';
import CopyrightNotice from '@/components/CopyrightNotice';
import CustomVideoPlayer from './CustomVideoPlayer';
import { logViolation, ViolationType } from '@/lib/firebase/violation-service';

interface ProtectedVideoPlayerProps {
  src: string;
  poster?: string;
  episodeId: string;
  userId?: string;
  onProtectionViolation?: (violation: any) => void;
}

export default function ProtectedVideoPlayer({
  src,
  poster,
  episodeId,
  userId,
  onProtectionViolation
}: ProtectedVideoPlayerProps) {
  const [protectionManager, setProtectionManager] = useState<ContentProtectionManager | null>(null);
  const [overlayState, setOverlayState] = useState({
    isActive: false,
    reason: '',
    severity: 'warning' as 'warning' | 'alert' | 'critical'
  });
  const [isBlurred, setIsBlurred] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [qualityDegraded, setQualityDegraded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const protectionRef = useRef<ContentProtectionManager | null>(null);

  useEffect(() => {
    // Initialize protection manager
    const manager = new ContentProtectionManager({
      blurOnDetection: true,
      muteOnDetection: true,
      degradeQuality: true,
      showWarning: true,
      terminateAfterViolations: 5,
      userId,
      contentId: episodeId
    });

    // Set up event handlers
    manager.on('onViolation', (violation: any) => {
      console.log('[Protection] Violation detected:', violation);
      
      // Determine severity based on violation count and confidence
      let severity: 'warning' | 'alert' | 'critical' = 'warning';
      if (violation.violationCount >= 3) severity = 'critical';
      else if (violation.violationCount >= 2 || violation.detection.confidence > 0.7) severity = 'alert';

      setOverlayState({
        isActive: true,
        reason: getViolationMessage(violation.detection.method),
        severity
      });

      // Always blur for iOS detections
      if (violation.detection.method.includes('ios')) {
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 5000);
      }

      if (onProtectionViolation) {
        onProtectionViolation(violation);
      }
    });

    manager.on('onProtectionActivated', () => {
      console.log('[Protection] Activated');
      setIsBlurred(true);
      setIsMuted(true);
      setQualityDegraded(true);

      // Mute video
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    });

    manager.on('onProtectionDeactivated', () => {
      console.log('[Protection] Deactivated');
      setIsBlurred(false);
      setIsMuted(false);
      setQualityDegraded(false);
      setOverlayState(prev => ({ ...prev, isActive: false }));

      // Unmute video
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
    });

    manager.on('onSessionTerminated', () => {
      console.log('[Protection] Session terminated');
      if (videoRef.current) {
        videoRef.current.pause();
      }
      
      // Log termination
      if (userId) {
        logViolation({
          userId,
          type: ViolationType.COPYRIGHT_VIOLATION,
          contentId: episodeId,
          metadata: {
            action: 'session_terminated',
            reason: 'repeated_violations'
          }
        });
      }
    });

    setProtectionManager(manager);
    protectionRef.current = manager;

    // Monitor video events
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      if (userId) {
        logViolation({
          userId,
          type: ViolationType.DOWNLOAD_ATTEMPT,
          contentId: episodeId,
          metadata: { action: 'right_click' }
        });
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);

    // Dispatch custom events for behavior monitoring
    const video = videoRef.current;
    if (video) {
      let seekCount = 0;
      let lastSeekTime = 0;

      video.addEventListener('seeking', () => {
        const now = Date.now();
        if (now - lastSeekTime < 2000) {
          seekCount++;
          if (seekCount > 5) {
            window.dispatchEvent(new Event('video-seek'));
            seekCount = 0;
          }
        }
        lastSeekTime = now;
      });

      video.addEventListener('pause', () => {
        window.dispatchEvent(new Event('video-pause'));
      });
    }

    return () => {
      manager.destroy();
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [episodeId, userId, onProtectionViolation]);

  const getViolationMessage = (method: string): string => {
    const messages: Record<string, string> = {
      ios_visibility_change: 'Screen activity detected - Recording may be in progress',
      ios_rapid_visibility_pattern: 'Screen recording pattern detected',
      ios_control_center_pattern: 'Control center access detected during playback',
      ios_app_switch: 'App switching detected - Please keep app in foreground',
      ios_memory_pressure: 'High system load detected - Recording suspected',
      frequent_tab_switching: 'Suspicious tab switching behavior detected',
      display_media_api: 'Screen capture attempt blocked',
      extension_detected: 'Recording extension detected',
      suspicious_user_behavior: 'Unusual playback pattern detected',
      android_recording_app: 'Recording application detected',
      virtual_camera_detected: 'Virtual camera software detected'
    };
    return messages[method] || 'Content protection violation detected';
  };

  const handleOverlayDismiss = () => {
    setOverlayState(prev => ({ ...prev, isActive: false }));
  };

  return (
    <div className="relative">
      {/* Copyright notice banner */}
      <CopyrightNotice variant="banner" />
      
      {/* Video player with protection */}
      <div className={`relative ${isBlurred ? 'filter blur-sm' : ''} transition-all duration-300`}>
        <CustomVideoPlayer
          src={src}
          poster={poster}
          videoRef={videoRef}
          className={qualityDegraded ? 'opacity-75' : ''}
          controls={!overlayState.isActive || overlayState.severity === 'warning'}
        />
        
        {/* Protection status indicator */}
        {protectionManager && (
          <div className="absolute top-2 right-2 bg-black/80 rounded px-2 py-1 text-xs">
            {protectionManager.getProtectionStatus().isActive ? (
              <span className="text-red-500">Protection Active</span>
            ) : (
              <span className="text-green-500">Protected</span>
            )}
          </div>
        )}
      </div>

      {/* Protection overlay */}
      <ProtectionOverlay
        isActive={overlayState.isActive}
        reason={overlayState.reason}
        severity={overlayState.severity}
        onDismiss={overlayState.severity === 'warning' ? handleOverlayDismiss : undefined}
      />

      {/* Copyright notice footer */}
      <div className="mt-4">
        <CopyrightNotice variant="compact" />
      </div>
    </div>
  );
}