// File validation utilities for audiobook platform

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  recommendation?: string;
}

export interface MediaRecommendations {
  video: string[];
  audio: string[];
  general: string[];
}

// Maximum file sizes (in bytes) - optimized for audiobook platform
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Recommended file sizes for optimal performance
const RECOMMENDED_VIDEO_SIZE = 250 * 1024 * 1024; // 250MB
const RECOMMENDED_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

// Optimized formats for audiobook platform - prioritize streaming and compression
const ALLOWED_VIDEO_FORMATS = [
  'video/mp4', // Preferred: Best browser support and streaming
];

const ALLOWED_AUDIO_FORMATS = [
  'audio/mpeg', // .mp3 - Preferred: Universal support
  'audio/aac', // .aac - Preferred: Better compression than MP3
  'audio/x-m4a', // .m4a - Good compression
];

const ALLOWED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// File extension mappings for browsers that don't provide proper MIME types
const VIDEO_EXTENSIONS = ['.mp4']; // Only MP4 for optimal streaming
const AUDIO_EXTENSIONS = ['.mp3', '.aac', '.m4a']; // Optimized audio formats
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export function validateVideoFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video file size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      recommendation: `For optimal streaming performance, keep videos under ${RECOMMENDED_VIDEO_SIZE / (1024 * 1024)}MB.`
    };
  }

  // Check file format by MIME type
  if (ALLOWED_VIDEO_FORMATS.includes(file.type)) {
    const result: FileValidationResult = { valid: true };
    
    // Add size recommendation if file is large but valid
    if (file.size > RECOMMENDED_VIDEO_SIZE) {
      result.recommendation = `Consider compressing your video. Files over ${RECOMMENDED_VIDEO_SIZE / (1024 * 1024)}MB may have slower upload and streaming performance. Recommended: MP4 with H.264 codec, 720p-1080p resolution.`;
    }
    
    return result;
  }

  // Fallback: check by file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid video format. For optimal streaming performance, only MP4 format is supported.`,
      recommendation: `Convert your video to MP4 format with H.264 codec for best compatibility and streaming performance.`
    };
  }

  // File has valid extension but unknown MIME type
  const result: FileValidationResult = { valid: true };
  if (file.size > RECOMMENDED_VIDEO_SIZE) {
    result.recommendation = `Consider compressing your video. Files over ${RECOMMENDED_VIDEO_SIZE / (1024 * 1024)}MB may have slower upload and streaming performance.`;
  }
  
  return result;
}

export function validateAudioFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_AUDIO_SIZE) {
    return {
      valid: false,
      error: `Audio file size must be less than ${MAX_AUDIO_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      recommendation: `For optimal streaming and storage efficiency, keep audio files under ${RECOMMENDED_AUDIO_SIZE / (1024 * 1024)}MB.`
    };
  }

  // Check file format by MIME type
  if (ALLOWED_AUDIO_FORMATS.includes(file.type)) {
    const result: FileValidationResult = { valid: true };
    
    // Add size recommendation if file is large but valid
    if (file.size > RECOMMENDED_AUDIO_SIZE) {
      result.recommendation = `Consider compressing your audio. Files over ${RECOMMENDED_AUDIO_SIZE / (1024 * 1024)}MB may have slower upload performance. Recommended: MP3 at 128-192 kbps or AAC at 128 kbps for optimal quality-to-size ratio.`;
    }
    
    return result;
  }

  // Fallback: check by file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = AUDIO_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid audio format. Supported formats: MP3, AAC, M4A only.`,
      recommendation: `Convert your audio to MP3 (128-192 kbps) or AAC (128 kbps) for optimal compatibility and file size. Avoid WAV and uncompressed formats for web delivery.`
    };
  }

  // File has valid extension but unknown MIME type
  const result: FileValidationResult = { valid: true };
  if (file.size > RECOMMENDED_AUDIO_SIZE) {
    result.recommendation = `Consider compressing your audio. Files over ${RECOMMENDED_AUDIO_SIZE / (1024 * 1024)}MB may have slower upload performance.`;
  }
  
  return result;
}

export function validateImageFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image file size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
    };
  }

  // Check file format by MIME type
  if (ALLOWED_IMAGE_FORMATS.includes(file.type)) {
    return { valid: true };
  }

  // Fallback: check by file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid image format. Allowed formats: ${IMAGE_EXTENSIONS.join(', ')}`
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get media format recommendations for optimal audiobook platform performance
export function getMediaRecommendations(): MediaRecommendations {
  return {
    video: [
      'Use MP4 format with H.264 codec for maximum compatibility',
      'Keep resolution between 720p-1080p for optimal streaming',
      'Target bitrate: 1-3 Mbps for good quality-to-size ratio',
      'Include proper video headers for progressive download',
      'Consider segments for adaptive streaming on longer content'
    ],
    audio: [
      'Use MP3 (128-192 kbps) for universal compatibility',
      'Use AAC (128 kbps) for better compression efficiency',
      'Avoid uncompressed formats (WAV, FLAC) for web delivery',
      'Normalize audio levels for consistent playback experience',
      'Include proper metadata (title, duration, chapters)'
    ],
    general: [
      'Compress files before upload to reduce storage costs',
      'Test playback on mobile devices for performance',
      'Use cloud storage for automatic CDN distribution',
      'Monitor Firebase Storage usage to control costs',
      'Consider client-side compression for large files'
    ]
  };
}

// Calculate estimated storage costs based on file size
export function calculateStorageCost(fileSizeBytes: number, monthlyDownloads: number = 0): {
  storageMonthly: number;
  bandwidthMonthly: number;
  total: number;
} {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const downloadGB = (fileSizeBytes * monthlyDownloads) / (1024 * 1024 * 1024);
  
  // Firebase Storage pricing (2025)
  const STORAGE_COST_PER_GB = 0.026; // $0.026 per GB stored
  const BANDWIDTH_COST_PER_GB = 0.20; // $0.20 per GB download (updated Aug 2025)
  
  const storageMonthly = fileSizeGB * STORAGE_COST_PER_GB;
  const bandwidthMonthly = downloadGB * BANDWIDTH_COST_PER_GB;
  
  return {
    storageMonthly: parseFloat(storageMonthly.toFixed(4)),
    bandwidthMonthly: parseFloat(bandwidthMonthly.toFixed(4)),
    total: parseFloat((storageMonthly + bandwidthMonthly).toFixed(4))
  };
}

// Analyze file for optimization potential
export function analyzeFileOptimization(file: File): {
  canOptimize: boolean;
  estimatedSavings: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let estimatedSavings = 0;
  let canOptimize = false;

  if (file.type.startsWith('video/')) {
    if (file.size > RECOMMENDED_VIDEO_SIZE) {
      canOptimize = true;
      estimatedSavings = Math.max(0.3, Math.min(0.7, (file.size - RECOMMENDED_VIDEO_SIZE) / file.size));
      recommendations.push('Video compression could reduce file size by 30-70%');
      recommendations.push('Consider lowering bitrate or resolution');
    }
  } else if (file.type.startsWith('audio/')) {
    if (file.type.includes('wav') || file.type.includes('flac')) {
      canOptimize = true;
      estimatedSavings = 0.8; // WAV to MP3 typically saves 80%
      recommendations.push('Convert uncompressed audio to MP3/AAC for 80% size reduction');
    } else if (file.size > RECOMMENDED_AUDIO_SIZE) {
      canOptimize = true;
      estimatedSavings = 0.3;
      recommendations.push('Audio compression could reduce file size by 30%');
      recommendations.push('Consider reducing bitrate to 128-192 kbps');
    }
  }

  return {
    canOptimize,
    estimatedSavings,
    recommendations
  };
}