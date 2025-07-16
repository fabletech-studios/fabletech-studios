import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot,
  UploadTask
} from 'firebase/storage';
import { storage, STORAGE_BUCKETS } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

// Generate storage path
function generateStoragePath(
  type: 'video' | 'audio' | 'thumbnail',
  seriesId: string,
  episodeNumber: number,
  fileName: string
): string {
  const bucket = type === 'video' ? STORAGE_BUCKETS.VIDEOS :
                type === 'audio' ? STORAGE_BUCKETS.AUDIO :
                STORAGE_BUCKETS.THUMBNAILS;
  
  const extension = fileName.split('.').pop();
  const uniqueName = `${seriesId}-episode-${episodeNumber}-${Date.now()}.${extension}`;
  
  return `${bucket}/${seriesId}/${uniqueName}`;
}

// Upload file with progress tracking
export async function uploadFile(
  file: File,
  type: 'video' | 'audio' | 'thumbnail',
  seriesId: string,
  episodeNumber: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const path = generateStoragePath(type, seriesId, episodeNumber, file.name);
    const storageRef = ref(storage, path);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        seriesId,
        episodeNumber: episodeNumber.toString(),
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    // Return promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            state: snapshot.state as any
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject({
            success: false,
            error: error.message || 'Upload failed'
          });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              url: downloadURL,
              path
            });
          } catch (error: any) {
            reject({
              success: false,
              error: error.message || 'Failed to get download URL'
            });
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}

// Delete file from storage
export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Delete failed'
    };
  }
}

// Upload multiple files (for bulk upload)
export async function uploadMultipleFiles(
  files: { file: File; type: 'video' | 'audio' | 'thumbnail' }[],
  seriesId: string,
  episodeNumber: number,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const { file, type } = files[i];
    const result = await uploadFile(
      file,
      type,
      seriesId,
      episodeNumber,
      (progress) => {
        if (onProgress) {
          onProgress(i, progress);
        }
      }
    );
    results.push(result);
  }
  
  return results;
}

// Get file URL from path
export async function getFileUrl(path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}

// Validate file before upload
export function validateFile(
  file: File,
  type: 'video' | 'audio' | 'thumbnail'
): { valid: boolean; error?: string } {
  const maxSizes = {
    video: 500 * 1024 * 1024, // 500MB
    audio: 100 * 1024 * 1024, // 100MB
    thumbnail: 10 * 1024 * 1024 // 10MB
  };

  const allowedTypes = {
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    thumbnail: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  };

  // Check file size
  if (file.size > maxSizes[type]) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizes[type] / 1024 / 1024}MB limit`
    };
  }

  // Check file type
  if (!allowedTypes[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes[type].join(', ')}`
    };
  }

  return { valid: true };
}