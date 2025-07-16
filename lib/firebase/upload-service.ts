// File upload service using Firebase Storage without authentication
import { storage } from './config';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';

export interface UploadProgress {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
  error?: string;
}

export interface UploadResult {
  url: string;
  fullPath: string;
  fileName: string;
  size: number;
}

// Upload video file
export async function uploadVideo(
  file: File,
  seriesId: string,
  episodeNumber: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult | null> {
  if (!storage) {
    console.error('Storage not initialized');
    return null;
  }

  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${seriesId}-ep${episodeNumber}-${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `videos/${seriesId}/${fileName}`);

    // Create upload task with streaming optimization headers
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
      customMetadata: {
        seriesId,
        episodeNumber: episodeNumber.toString(),
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        optimizedForStreaming: 'true',
        recommendedBitrate: '1500000', // 1.5 Mbps
        targetResolution: '720p'
      }
    });

    // Return a promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress) {
            onProgress({
              progress,
              state: snapshot.state as 'running' | 'paused'
            });
          }
        },
        (error) => {
          console.error('Upload error:', error);
          if (onProgress) {
            onProgress({
              progress: 0,
              state: 'error',
              error: error.message
            });
          }
          reject(error);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          if (onProgress) {
            onProgress({
              progress: 100,
              state: 'success'
            });
          }

          resolve({
            url: downloadURL,
            fullPath: uploadTask.snapshot.ref.fullPath,
            fileName,
            size: file.size
          });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
  }
}

// Upload audio file
export async function uploadAudio(
  file: File,
  seriesId: string,
  episodeNumber: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult | null> {
  if (!storage) {
    console.error('Storage not initialized');
    return null;
  }

  try {
    const timestamp = Date.now();
    const fileName = `${seriesId}-ep${episodeNumber}-${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `audio/${seriesId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
      customMetadata: {
        seriesId,
        episodeNumber: episodeNumber.toString(),
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        optimizedForStreaming: 'true',
        recommendedBitrate: '128000', // 128 kbps for audio
        audioFormat: file.type.includes('aac') ? 'aac' : 'mp3'
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress) {
            onProgress({
              progress,
              state: snapshot.state as 'running' | 'paused'
            });
          }
        },
        (error) => {
          console.error('Upload error:', error);
          if (onProgress) {
            onProgress({
              progress: 0,
              state: 'error',
              error: error.message
            });
          }
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          if (onProgress) {
            onProgress({
              progress: 100,
              state: 'success'
            });
          }

          resolve({
            url: downloadURL,
            fullPath: uploadTask.snapshot.ref.fullPath,
            fileName,
            size: file.size
          });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return null;
  }
}

// Upload thumbnail image
export async function uploadThumbnail(
  file: File,
  seriesId: string,
  episodeNumber?: number
): Promise<UploadResult | null> {
  if (!storage) {
    console.error('Storage not initialized');
    return null;
  }

  try {
    const timestamp = Date.now();
    const folder = episodeNumber ? `thumbnails/${seriesId}/episodes` : `thumbnails/${seriesId}`;
    const prefix = episodeNumber ? `ep${episodeNumber}-` : 'cover-';
    const fileName = `${prefix}${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const snapshot = await uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
      customMetadata: {
        seriesId,
        episodeNumber: episodeNumber?.toString() || '',
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        imageOptimized: 'true',
        thumbnailFor: episodeNumber ? 'episode' : 'series'
      }
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      fullPath: snapshot.ref.fullPath,
      fileName,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }
}

// Delete file from storage
export async function deleteFile(fullPath: string): Promise<boolean> {
  if (!storage) {
    console.error('Storage not initialized');
    return false;
  }

  try {
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// List all files in a folder
export async function listFiles(folderPath: string): Promise<string[]> {
  if (!storage) {
    console.error('Storage not initialized');
    return [];
  }

  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    const urls = await Promise.all(
      result.items.map(itemRef => getDownloadURL(itemRef))
    );
    
    return urls;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}