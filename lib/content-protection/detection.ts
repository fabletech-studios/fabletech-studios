'use client';

interface DetectionResult {
  isRecording: boolean;
  method?: string;
  confidence: number;
  timestamp: number;
}

export class ScreenRecordingDetector {
  private callbacks: ((result: DetectionResult) => void)[] = [];
  private isMonitoring = false;
  private lastVisibilityChange = 0;
  private suspiciousActivityCount = 0;
  private detectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // iOS Screen Recording Detection using visibility API
    this.detectIOSRecording();
    
    // Browser tab switching monitoring
    this.monitorTabSwitching();
    
    // Screen capture API detection
    this.detectScreenCapture();
    
    // User behavior pattern monitoring
    this.monitorUserBehavior();
    
    // Start periodic detection
    this.startPeriodicDetection();
  }

  private detectIOSRecording() {
    if (typeof document === 'undefined') return;

    // iOS specific: Screen recording often triggers visibility changes
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      const timeSinceLastChange = now - this.lastVisibilityChange;
      
      // Rapid visibility changes might indicate recording
      if (timeSinceLastChange < 1000 && document.hidden) {
        this.reportDetection({
          isRecording: true,
          method: 'ios_visibility_pattern',
          confidence: 0.7,
          timestamp: now
        });
      }
      
      this.lastVisibilityChange = now;
    });

    // iOS specific: Detect control center access patterns
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const isSwipeFromTop = touchStartY < 50 && touchEndY > 100;
      
      if (isSwipeFromTop) {
        // Potential control center access
        setTimeout(() => {
          if (document.hidden) {
            this.reportDetection({
              isRecording: true,
              method: 'ios_control_center_pattern',
              confidence: 0.6,
              timestamp: Date.now()
            });
          }
        }, 500);
      }
    });
  }

  private monitorTabSwitching() {
    let hiddenCount = 0;
    let lastHiddenTime = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenCount++;
        lastHiddenTime = Date.now();
        
        // Multiple tab switches in short period
        if (hiddenCount > 3) {
          this.reportDetection({
            isRecording: true,
            method: 'frequent_tab_switching',
            confidence: 0.5,
            timestamp: Date.now()
          });
        }
      } else {
        // Check if tab was hidden for suspicious duration
        const hiddenDuration = Date.now() - lastHiddenTime;
        if (hiddenDuration > 5000 && hiddenDuration < 30000) {
          this.suspiciousActivityCount++;
        }
      }
    });

    // Reset counter periodically
    setInterval(() => {
      hiddenCount = Math.max(0, hiddenCount - 1);
    }, 60000);
  }

  private detectScreenCapture() {
    // Check for screen capture extensions
    if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
      // Monitor for display media usage
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function(...args) {
        this.reportDetection({
          isRecording: true,
          method: 'display_media_api',
          confidence: 0.9,
          timestamp: Date.now()
        });
        return originalGetDisplayMedia.apply(navigator.mediaDevices, args);
      }.bind(this);
    }

    // Detect common screen recording extensions
    this.detectExtensions();
  }

  private detectExtensions() {
    const extensionIds = [
      'nlipoenfbbikpbjkfpfillcgkiblehma', // Awesome Screenshot
      'gppongmhjkpfnbhagpmjfkannfbllamg', // Wappalyzer
      'mmeijimgabbpbgpdklnllpncmdofkcpn', // Screencastify
      'liecbddmkiiihnedobmlmillhodjkdmb', // Loom
    ];

    extensionIds.forEach(id => {
      const img = new Image();
      img.src = `chrome-extension://${id}/icons/icon128.png`;
      img.onload = () => {
        this.reportDetection({
          isRecording: true,
          method: 'extension_detected',
          confidence: 0.8,
          timestamp: Date.now()
        });
      };
    });
  }

  private monitorUserBehavior() {
    let seekCount = 0;
    let pauseCount = 0;
    let lastActionTime = Date.now();

    // This will be called by the video player
    window.addEventListener('video-seek', () => {
      seekCount++;
      this.checkSuspiciousBehavior();
    });

    window.addEventListener('video-pause', () => {
      pauseCount++;
      this.checkSuspiciousBehavior();
    });

    const checkSuspiciousBehavior = () => {
      const now = Date.now();
      const timeSinceLastAction = now - lastActionTime;
      
      // Rapid seeking or pausing
      if (timeSinceLastAction < 2000 && (seekCount > 5 || pauseCount > 5)) {
        this.reportDetection({
          isRecording: true,
          method: 'suspicious_user_behavior',
          confidence: 0.6,
          timestamp: now
        });
      }
      
      lastActionTime = now;
    };

    this.checkSuspiciousBehavior = checkSuspiciousBehavior;

    // Reset counters
    setInterval(() => {
      seekCount = Math.max(0, seekCount - 1);
      pauseCount = Math.max(0, pauseCount - 1);
    }, 30000);
  }

  private startPeriodicDetection() {
    this.detectionInterval = setInterval(() => {
      // Check for Android-specific indicators
      this.detectAndroidRecording();
      
      // Check for desktop recording software
      this.detectDesktopRecording();
    }, 5000);
  }

  private detectAndroidRecording() {
    // Android specific checks
    if (navigator.userAgent.includes('Android')) {
      // Check for common recording app signatures
      const recordingApps = ['AZ Screen', 'DU Recorder', 'Mobizen'];
      
      // Check if any recording apps are in the referrer
      recordingApps.forEach(app => {
        if (document.referrer.toLowerCase().includes(app.toLowerCase())) {
          this.reportDetection({
            isRecording: true,
            method: 'android_recording_app',
            confidence: 0.8,
            timestamp: Date.now()
          });
        }
      });

      // Check for Android screen recording indicators
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {
          // Wake lock denied might indicate recording
          this.suspiciousActivityCount++;
        });
      }
    }
  }

  private detectDesktopRecording() {
    // Check for OBS virtual camera
    if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        devices.forEach(device => {
          if (device.label.toLowerCase().includes('obs') || 
              device.label.toLowerCase().includes('virtual')) {
            this.reportDetection({
              isRecording: true,
              method: 'virtual_camera_detected',
              confidence: 0.7,
              timestamp: Date.now()
            });
          }
        });
      });
    }

    // Check system performance indicators
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        // High memory usage might indicate recording
        this.suspiciousActivityCount++;
      }
    }
  }

  private reportDetection(result: DetectionResult) {
    this.callbacks.forEach(callback => callback(result));
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Screen Recording Detection]', result);
    }
  }

  public onDetection(callback: (result: DetectionResult) => void) {
    this.callbacks.push(callback);
  }

  public removeDetectionListener(callback: (result: DetectionResult) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  public getSuspicionLevel(): number {
    return Math.min(this.suspiciousActivityCount / 10, 1);
  }

  public resetSuspicion() {
    this.suspiciousActivityCount = 0;
  }

  public destroy() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    this.callbacks = [];
    this.isMonitoring = false;
  }
}