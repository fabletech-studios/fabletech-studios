/**
 * Direct upload to Firebase Storage from client-side
 * Bypasses server for large files to avoid platform limits
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from './firebase/client-config';
import { doc, updateDoc } from 'firebase/firestore';

export interface DirectUploadOptions {
  file: File;
  path: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (downloadURL: string) => void;
  metadata?: Record<string, any>;
}

export async function uploadDirectToFirebase({
  file,
  path,
  onProgress,
  onError,
  onComplete,
  metadata = {}
}: DirectUploadOptions): Promise<string> {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: metadata
    });
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          if (onError) {
            onError(error);
          }
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (onComplete) {
              onComplete(downloadURL);
            }
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    throw error;
  }
}

export async function uploadEpisodeFilesDirectly(
  seriesId: string,
  episodeId: string,
  episodeNumber: number,
  files: {
    video?: File;
    audio?: File;
    thumbnail?: File;
  }
): Promise<{
  videoPath?: string;
  audioPath?: string;
  thumbnailPath?: string;
}> {
  const results: any = {};
  
  // Upload video if provided
  if (files.video) {
    const videoPath = `episodes/${seriesId}/episode-${episodeNumber}-video-${Date.now()}.${files.video.name.split('.').pop()}`;
    results.videoPath = await uploadDirectToFirebase({
      file: files.video,
      path: videoPath,
      metadata: {
        seriesId,
        episodeId,
        episodeNumber: episodeNumber.toString(),
        fileType: 'video'
      }
    });
  }
  
  // Upload audio if provided
  if (files.audio) {
    const audioPath = `episodes/${seriesId}/episode-${episodeNumber}-audio-${Date.now()}.${files.audio.name.split('.').pop()}`;
    results.audioPath = await uploadDirectToFirebase({
      file: files.audio,
      path: audioPath,
      metadata: {
        seriesId,
        episodeId,
        episodeNumber: episodeNumber.toString(),
        fileType: 'audio'
      }
    });
  }
  
  // Upload thumbnail if provided
  if (files.thumbnail) {
    const thumbnailPath = `episodes/${seriesId}/episode-${episodeNumber}-thumbnail-${Date.now()}.${files.thumbnail.name.split('.').pop()}`;
    results.thumbnailPath = await uploadDirectToFirebase({
      file: files.thumbnail,
      path: thumbnailPath,
      metadata: {
        seriesId,
        episodeId,
        episodeNumber: episodeNumber.toString(),
        fileType: 'thumbnail'
      }
    });
  }
  
  return results;
}

export async function updateEpisodeWithDirectUpload(
  seriesId: string,
  episodeData: any,
  files: {
    video?: File;
    audio?: File;
    thumbnail?: File;
  }
): Promise<void> {
  // First upload files directly to Firebase Storage
  const uploadedPaths = await uploadEpisodeFilesDirectly(
    seriesId,
    episodeData.episodeId,
    episodeData.episodeNumber,
    files
  );
  
  // Then update the episode data with the new file paths
  const updateData = {
    ...episodeData,
    ...uploadedPaths,
    updatedAt: new Date().toISOString()
  };
  
  // Call the API to update episode metadata only (no file upload)
  const response = await fetch(`/api/content/${seriesId}/episode/${episodeData.episodeId}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ episodeData: updateData })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update episode metadata');
  }
}