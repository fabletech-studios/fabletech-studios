'use client';

import { ScreenRecordingDetector } from './detection';
import { logViolation, ViolationType } from '@/lib/firebase/violation-service';

export interface ProtectionConfig {
  blurOnDetection: boolean;
  muteOnDetection: boolean;
  degradeQuality: boolean;
  showWarning: boolean;
  terminateAfterViolations: number;
  userId?: string;
  contentId?: string;
}

export class ContentProtectionManager {
  private detector: ScreenRecordingDetector;
  private config: ProtectionConfig;
  private violationCount = 0;
  private isProtectionActive = false;
  private callbacks: {
    onViolation?: (violation: any) => void;
    onProtectionActivated?: () => void;
    onProtectionDeactivated?: () => void;
    onSessionTerminated?: () => void;
  } = {};

  constructor(config: ProtectionConfig) {
    this.config = config;
    this.detector = new ScreenRecordingDetector();
    this.initialize();
  }

  private initialize() {
    this.detector.onDetection(async (result) => {
      if (result.isRecording && result.confidence > 0.5) {
        await this.handleViolation(result);
      }
    });
  }

  private async handleViolation(detection: any) {
    this.violationCount++;
    
    // Log violation to Firestore
    if (this.config.userId) {
      await logViolation({
        userId: this.config.userId,
        type: ViolationType.SCREEN_RECORDING,
        contentId: this.config.contentId,
        detection: {
          method: detection.method,
          confidence: detection.confidence,
          timestamp: detection.timestamp
        },
        metadata: {
          userAgent: navigator.userAgent,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          violationCount: this.violationCount
        }
      });
    }

    // Activate protection measures
    this.activateProtection();

    // Check if session should be terminated
    if (this.violationCount >= this.config.terminateAfterViolations) {
      this.terminateSession();
    }

    // Notify callbacks
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation({
        detection,
        violationCount: this.violationCount,
        protectionActive: this.isProtectionActive
      });
    }
  }

  private activateProtection() {
    if (this.isProtectionActive) return;
    
    this.isProtectionActive = true;
    
    if (this.callbacks.onProtectionActivated) {
      this.callbacks.onProtectionActivated();
    }

    // Auto-deactivate after 30 seconds
    setTimeout(() => {
      this.deactivateProtection();
    }, 30000);
  }

  private deactivateProtection() {
    this.isProtectionActive = false;
    
    if (this.callbacks.onProtectionDeactivated) {
      this.callbacks.onProtectionDeactivated();
    }
  }

  private terminateSession() {
    if (this.callbacks.onSessionTerminated) {
      this.callbacks.onSessionTerminated();
    }
    
    // Force redirect to home
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  }

  public getProtectionStatus() {
    return {
      isActive: this.isProtectionActive,
      violationCount: this.violationCount,
      suspicionLevel: this.detector.getSuspicionLevel()
    };
  }

  public resetViolations() {
    this.violationCount = 0;
    this.detector.resetSuspicion();
  }

  public on(event: string, callback: Function) {
    (this.callbacks as any)[event] = callback;
  }

  public destroy() {
    this.detector.destroy();
    this.callbacks = {};
  }
}