// Utility functions to handle episode data consistency

export interface NormalizedEpisode {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  videoUrl: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  credits?: number;
  isFree?: boolean;
}

// Normalize episode data from different sources
export function normalizeEpisode(episode: any): NormalizedEpisode {
  return {
    id: episode.id || episode.episodeId,
    episodeId: episode.episodeId || episode.id,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    description: episode.description,
    // Prefer videoUrl over videoPath for consistency
    videoUrl: episode.videoUrl || episode.videoPath || '',
    audioUrl: episode.audioUrl || episode.audioPath || '',
    thumbnailUrl: episode.thumbnailUrl || episode.thumbnailPath || '',
    duration: episode.duration,
    credits: episode.credits,
    isFree: episode.isFree
  };
}

// Check if a URL is a Firebase Storage path
export function isFirebaseStoragePath(url: string): boolean {
  return url.startsWith('videos/') || 
         url.startsWith('audio/') || 
         url.startsWith('uploads/') ||
         url.startsWith('thumbnails/');
}

// Get media type from URL
export function getMediaType(url: string): 'video' | 'audio' | 'image' | 'unknown' {
  const ext = url.split('.').pop()?.toLowerCase();
  
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const audioExts = ['mp3', 'm4a', 'wav', 'ogg', 'aac'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (ext && videoExts.includes(ext)) return 'video';
  if (ext && audioExts.includes(ext)) return 'audio';
  if (ext && imageExts.includes(ext)) return 'image';
  
  // Check by path prefix
  if (url.includes('video')) return 'video';
  if (url.includes('audio')) return 'audio';
  if (url.includes('thumbnail')) return 'image';
  
  return 'unknown';
}