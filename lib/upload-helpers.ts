/**
 * Helper functions for handling file uploads with validation and progress tracking
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const FILE_SIZE_LIMITS = {
  video: 500 * 1024 * 1024, // 500MB
  audio: 500 * 1024 * 1024, // 500MB
  image: 10 * 1024 * 1024,  // 10MB
  thumbnail: 10 * 1024 * 1024, // 10MB
  banner: 5 * 1024 * 1024, // 5MB
};

export const ALLOWED_FILE_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateFile(file: File, type: 'video' | 'audio' | 'image' | 'thumbnail' | 'banner'): FileValidationResult {
  // Check file size
  const sizeLimit = type === 'thumbnail' || type === 'banner' 
    ? FILE_SIZE_LIMITS.image 
    : FILE_SIZE_LIMITS[type as keyof typeof FILE_SIZE_LIMITS];
    
  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(sizeLimit)}`
    };
  }
  
  // Check file type
  const fileTypeCategory = type === 'thumbnail' || type === 'banner' ? 'image' : type;
  const allowedTypes = ALLOWED_FILE_TYPES[fileTypeCategory as keyof typeof ALLOWED_FILE_TYPES];
  
  if (!allowedTypes.includes(file.type)) {
    // Check by extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = {
      video: ['mp4', 'webm', 'ogg', 'mov'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    };
    
    const categoryExtensions = validExtensions[fileTypeCategory as keyof typeof validExtensions];
    if (!extension || !categoryExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
  }
  
  return { valid: true };
}

export async function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        };
        onProgress(progress);
      }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
      resolve(response);
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });
    
    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }
    
    // Send request
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

export function createChunkedUpload(file: File, chunkSize: number = 5 * 1024 * 1024) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;
  
  return {
    totalChunks,
    hasNext: () => currentChunk < totalChunks,
    getNextChunk: () => {
      if (currentChunk >= totalChunks) return null;
      
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      currentChunk++;
      
      return {
        chunk,
        chunkNumber: currentChunk,
        isLastChunk: currentChunk === totalChunks,
        progress: (currentChunk / totalChunks) * 100
      };
    },
    reset: () => {
      currentChunk = 0;
    }
  };
}