import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

/**
 * Upload a file directly to Firebase Storage from the browser
 * This bypasses Vercel's 4.5MB limit for serverless functions
 * Returns the download URL after successful upload
 */
export async function uploadToFirebaseStorage(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured');
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round(progress)
          });
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload episode files and return their URLs
 * Handles video, audio, and thumbnail files
 */
export async function uploadEpisodeFiles(
  seriesId: string,
  episodeNumber: number,
  files: {
    video?: File;
    audio?: File;
    thumbnail?: File;
  },
  onProgress?: (type: 'video' | 'audio' | 'thumbnail', progress: UploadProgress) => void
): Promise<{
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
}> {
  const results: any = {};
  const timestamp = Date.now();
  
  // Upload video if provided
  if (files.video) {
    const videoExt = files.video.name.split('.').pop() || 'mp4';
    const videoPath = `videos/${seriesId}/episode-${episodeNumber}-${timestamp}.${videoExt}`;
    
    results.videoUrl = await uploadToFirebaseStorage(
      files.video,
      videoPath,
      (progress) => onProgress?.('video', progress)
    );
  }
  
  // Upload audio if provided
  if (files.audio) {
    const audioExt = files.audio.name.split('.').pop() || 'mp3';
    const audioPath = `audio/${seriesId}/episode-${episodeNumber}-${timestamp}.${audioExt}`;
    
    results.audioUrl = await uploadToFirebaseStorage(
      files.audio,
      audioPath,
      (progress) => onProgress?.('audio', progress)
    );
  }
  
  // Upload thumbnail if provided
  if (files.thumbnail) {
    const thumbnailExt = files.thumbnail.name.split('.').pop() || 'jpg';
    const thumbnailPath = `thumbnails/${seriesId}/episode-${episodeNumber}-${timestamp}.${thumbnailExt}`;
    
    results.thumbnailUrl = await uploadToFirebaseStorage(
      files.thumbnail,
      thumbnailPath,
      (progress) => onProgress?.('thumbnail', progress)
    );
  }
  
  return results;
}