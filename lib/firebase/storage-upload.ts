import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export async function uploadFileToFirebase(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        };
        onProgress?.(progress);
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

export async function uploadEpisodeFiles(
  seriesId: string,
  episodeNumber: number,
  files: {
    video?: File;
    audio?: File;
    thumbnail?: File;
  },
  onProgress?: (type: string, progress: UploadProgress) => void
): Promise<{
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
}> {
  const timestamp = Date.now();
  const results: any = {};

  // Upload video if provided
  if (files.video) {
    const videoPath = `episodes/${seriesId}/episode-${episodeNumber}-video-${timestamp}.${files.video.name.split('.').pop()}`;
    results.videoUrl = await uploadFileToFirebase(
      files.video,
      videoPath,
      (progress) => onProgress?.('video', progress)
    );
  }

  // Upload audio if provided
  if (files.audio) {
    const audioPath = `episodes/${seriesId}/episode-${episodeNumber}-audio-${timestamp}.${files.audio.name.split('.').pop()}`;
    results.audioUrl = await uploadFileToFirebase(
      files.audio,
      audioPath,
      (progress) => onProgress?.('audio', progress)
    );
  }

  // Upload thumbnail if provided
  if (files.thumbnail) {
    const thumbnailPath = `episodes/${seriesId}/episode-${episodeNumber}-thumbnail-${timestamp}.${files.thumbnail.name.split('.').pop()}`;
    results.thumbnailUrl = await uploadFileToFirebase(
      files.thumbnail,
      thumbnailPath,
      (progress) => onProgress?.('thumbnail', progress)
    );
  }

  return results;
}