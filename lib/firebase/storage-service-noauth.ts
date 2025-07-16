// Storage service that works without Firebase Auth
// Uses Firebase Storage directly with public rules

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from './config';

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

// Test Storage connection
export async function testStorageConnection(): Promise<boolean> {
  try {
    // Check if storage is initialized
    return !!storage && !!storage.app;
  } catch (error) {
    console.error('Storage connection test failed:', error);
    return false;
  }
}

// Generate storage path for public uploads
function generateStoragePathNoAuth(
  type: 'video' | 'audio' | 'thumbnail',
  seriesId: string,
  episodeNumber: number,
  fileName: string
): string {
  const extension = fileName.split('.').pop();
  const timestamp = Date.now();
  const folder = type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'thumbnails';
  
  // Public path structure
  return `public/${folder}/${seriesId}/episode-${episodeNumber}-${timestamp}.${extension}`;
}

// Upload file without auth (requires public write rules or admin SDK)
export async function uploadFileNoAuth(
  file: File,
  type: 'video' | 'audio' | 'thumbnail',
  seriesId: string,
  episodeNumber: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const path = generateStoragePathNoAuth(type, seriesId, episodeNumber, file.name);
    const storageRef = ref(storage, path);
    
    console.log('Uploading to path:', path);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        seriesId,
        episodeNumber: episodeNumber.toString(),
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'local-user' // Since no auth
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
          
          let errorMessage = 'Upload failed';
          
          // Handle specific storage errors
          if (error.code === 'storage/unauthorized') {
            errorMessage = 'Unauthorized: Check Firebase Storage rules (may need to allow public uploads temporarily)';
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload was cancelled';
          } else if (error.code === 'storage/unknown') {
            errorMessage = 'Unknown error occurred. Check network connection and Firebase Storage settings';
          }
          
          reject({
            success: false,
            error: errorMessage + ': ' + error.message
          });
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            console.log('Upload successful, URL:', downloadURL);
            
            resolve({
              success: true,
              url: downloadURL,
              path
            });
          } catch (error: any) {
            console.error('Error getting download URL:', error);
            reject({
              success: false,
              error: 'Upload succeeded but failed to get download URL: ' + error.message
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
export async function deleteFileNoAuth(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    console.log('File deleted from storage:', path);
    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    
    // It's okay if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    
    return {
      success: false,
      error: error.message || 'Delete failed'
    };
  }
}

// Get a public URL for a file (if it exists)
export async function getFileUrlNoAuth(path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error('Error getting file URL:', error);
    }
    return null;
  }
}

// Storage configuration info
export function getStorageConfig() {
  return {
    bucket: storage?.app?.options?.storageBucket || 'Not configured',
    maxUploadSize: '500MB for video, 100MB for audio, 10MB for images',
    supportedVideoFormats: ['mp4', 'webm', 'mov'],
    supportedAudioFormats: ['mp3', 'wav', 'aac', 'm4a'],
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  };
}