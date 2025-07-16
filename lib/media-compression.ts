// Client-side media compression utilities for audiobook platform

export interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  file?: File;
  error?: string;
}

export interface CompressionOptions {
  video?: {
    quality: number; // 0.1 to 1.0
    maxWidth: number;
    maxHeight: number;
    targetBitrate?: number;
  };
  audio?: {
    quality: number; // 0.1 to 1.0
    bitrate?: number; // in kbps
    sampleRate?: number;
  };
  image?: {
    quality: number; // 0.1 to 1.0
    maxWidth: number;
    maxHeight: number;
    format?: 'jpeg' | 'webp' | 'png';
  };
}

// Default compression settings optimized for audiobook platform
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  video: {
    quality: 0.7,
    maxWidth: 1280,
    maxHeight: 720,
    targetBitrate: 1500 // 1.5 Mbps
  },
  audio: {
    quality: 0.8,
    bitrate: 128, // 128 kbps
    sampleRate: 44100
  },
  image: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'jpeg'
  }
};

// Compress image files using Canvas API
export async function compressImage(
  file: File, 
  options: CompressionOptions['image'] = DEFAULT_COMPRESSION_OPTIONS.image!
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve({
        success: false,
        originalSize: file.size,
        compressedSize: file.size,
        savingsPercent: 0,
        error: 'Canvas context not available'
      });
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${options.format || 'jpeg'}`,
              lastModified: Date.now()
            });

            const savingsPercent = ((file.size - blob.size) / file.size) * 100;

            resolve({
              success: true,
              originalSize: file.size,
              compressedSize: blob.size,
              savingsPercent: Math.max(0, savingsPercent),
              file: compressedFile
            });
          } else {
            resolve({
              success: false,
              originalSize: file.size,
              compressedSize: file.size,
              savingsPercent: 0,
              error: 'Failed to compress image'
            });
          }
        },
        `image/${options.format || 'jpeg'}`,
        options.quality || 0.8
      );
    };

    img.onerror = () => {
      resolve({
        success: false,
        originalSize: file.size,
        compressedSize: file.size,
        savingsPercent: 0,
        error: 'Failed to load image'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

// Basic audio compression using Web Audio API (limited compression capabilities)
export async function compressAudio(
  file: File,
  options: CompressionOptions['audio'] = DEFAULT_COMPRESSION_OPTIONS.audio!
): Promise<CompressionResult> {
  try {
    // For now, we can only reduce quality through re-encoding
    // This is a simplified approach - real audio compression would require FFmpeg.wasm
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Simple approach: reduce sample rate if specified
    const targetSampleRate = options.sampleRate || audioBuffer.sampleRate;
    
    if (targetSampleRate < audioBuffer.sampleRate) {
      // This is a very basic downsampling - not optimal quality
      const ratio = audioBuffer.sampleRate / targetSampleRate;
      const newLength = Math.floor(audioBuffer.length / ratio);
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        targetSampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = newBuffer.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          outputData[i] = inputData[Math.floor(i * ratio)];
        }
      }

      // This is a simplified approach - real implementation would need proper encoding
      return {
        success: false,
        originalSize: file.size,
        compressedSize: file.size,
        savingsPercent: 0,
        error: 'Audio compression requires server-side processing. Consider converting to MP3 at 128kbps or AAC externally.'
      };
    }

    return {
      success: false,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercent: 0,
      error: 'Client-side audio compression is limited. Use external tools to convert to MP3/AAC.'
    };

  } catch (error) {
    return {
      success: false,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercent: 0,
      error: 'Audio compression failed: ' + (error as Error).message
    };
  }
}

// Video compression is complex and requires FFmpeg.wasm for proper implementation
export async function compressVideo(
  file: File,
  options: CompressionOptions['video'] = DEFAULT_COMPRESSION_OPTIONS.video!
): Promise<CompressionResult> {
  // For now, return an informational message about video compression
  return {
    success: false,
    originalSize: file.size,
    compressedSize: file.size,
    savingsPercent: 0,
    error: 'Client-side video compression requires FFmpeg.wasm library. Consider using external tools to compress to MP4 with H.264 codec at 1-3 Mbps bitrate.'
  };
}

// Main compression function that routes to appropriate method
export async function compressFile(
  file: File,
  options: CompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<CompressionResult> {
  const fileType = file.type.toLowerCase();

  if (fileType.startsWith('image/')) {
    return compressImage(file, options.image);
  } else if (fileType.startsWith('audio/')) {
    return compressAudio(file, options.audio);
  } else if (fileType.startsWith('video/')) {
    return compressVideo(file, options.video);
  }

  return {
    success: false,
    originalSize: file.size,
    compressedSize: file.size,
    savingsPercent: 0,
    error: 'Unsupported file type for compression'
  };
}

// Check if compression is available for a file type
export function isCompressionAvailable(file: File): boolean {
  const fileType = file.type.toLowerCase();
  
  // Only image compression is reliably available client-side
  return fileType.startsWith('image/');
}

// Get compression recommendations based on file
export function getCompressionRecommendations(file: File): string[] {
  const fileType = file.type.toLowerCase();
  const recommendations: string[] = [];

  if (fileType.startsWith('video/')) {
    recommendations.push('Use external tools like HandBrake or FFmpeg to compress videos');
    recommendations.push('Target H.264 codec with 1-3 Mbps bitrate for web delivery');
    recommendations.push('Consider 720p resolution for optimal size-to-quality ratio');
    recommendations.push('Ensure proper video headers for progressive download');
  } else if (fileType.startsWith('audio/')) {
    recommendations.push('Convert to MP3 at 128-192 kbps using external tools');
    recommendations.push('Use AAC format for better compression at 128 kbps');
    recommendations.push('Avoid uncompressed formats (WAV, FLAC) for web delivery');
    recommendations.push('Normalize audio levels for consistent playback');
  } else if (fileType.startsWith('image/')) {
    recommendations.push('Images can be compressed automatically before upload');
    recommendations.push('JPEG format recommended for photographs');
    recommendations.push('WebP format for best compression with quality');
    recommendations.push('Keep image dimensions reasonable for web display');
  }

  return recommendations;
}