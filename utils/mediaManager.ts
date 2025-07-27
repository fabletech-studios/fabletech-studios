// Singleton manager to ensure only one media element plays at a time
class MediaManager {
  private static instance: MediaManager;
  private currentMedia: HTMLMediaElement | null = null;
  private cleanupCallbacks: Map<HTMLMediaElement, () => void> = new Map();

  private constructor() {}

  static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager();
    }
    return MediaManager.instance;
  }

  registerMedia(media: HTMLMediaElement, cleanup?: () => void): void {
    // Skip if it's the same media element
    if (this.currentMedia === media) {
      return;
    }
    
    // Registering new media element
    
    // Pause and cleanup previous media if exists
    if (this.currentMedia && this.currentMedia !== media) {
      try {
        // Pausing previous media
        this.currentMedia.pause();
        this.currentMedia.currentTime = 0;
      } catch (error) {
        console.warn('Error pausing previous media:', error);
      }
      
      // Run cleanup callback if exists
      const prevCleanup = this.cleanupCallbacks.get(this.currentMedia);
      if (prevCleanup) {
        prevCleanup();
        this.cleanupCallbacks.delete(this.currentMedia);
      }
    }
    
    this.currentMedia = media;
    if (cleanup) {
      this.cleanupCallbacks.set(media, cleanup);
    }
  }

  unregisterMedia(media: HTMLMediaElement): void {
    if (this.currentMedia === media) {
      // Run cleanup callback if exists
      const cleanup = this.cleanupCallbacks.get(media);
      if (cleanup) {
        cleanup();
        this.cleanupCallbacks.delete(media);
      }
      
      this.currentMedia = null;
    }
  }

  getCurrentMedia(): HTMLMediaElement | null {
    return this.currentMedia;
  }

  pauseAll(): void {
    if (this.currentMedia) {
      try {
        this.currentMedia.pause();
      } catch (error) {
        console.warn('Error pausing media:', error);
      }
    }
  }
}

export default MediaManager;