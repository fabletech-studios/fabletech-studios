// Convert local upload paths to API media paths
export function convertToMediaUrl(path: string | undefined, useProxy: boolean = false): string | undefined {
  if (!path) return undefined;
  
  // If it's a Firebase Storage URL and proxy is enabled, use the proxy
  if (path.startsWith('https://storage.googleapis.com/') && useProxy) {
    return `/api/proxy/image?url=${encodeURIComponent(path)}`;
  }
  
  // If it's already a full URL (Firebase Storage), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Convert /uploads/... to /api/media/...
  if (path.startsWith('/uploads/')) {
    return path.replace('/uploads/', '/api/media/');
  }
  
  return path;
}

// Convert all media paths in an episode
export function convertEpisodeMediaPaths(episode: any) {
  return {
    ...episode,
    videoPath: convertToMediaUrl(episode.videoPath),
    audioPath: convertToMediaUrl(episode.audioPath),
    thumbnailPath: convertToMediaUrl(episode.thumbnailPath),
  };
}

// Convert all episodes in a series
export function convertSeriesMediaPaths(series: any) {
  return {
    ...series,
    bannerImage: convertToMediaUrl(series.bannerImage),
    bannerUrl: convertToMediaUrl(series.bannerUrl || series.bannerImage),
    episodes: series.episodes?.map(convertEpisodeMediaPaths) || [],
  };
}