import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSeriesFirebase, addEpisodeFirebase } from '@/lib/firebase/content-service';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  console.log('Simple episode endpoint called');
  
  try {
    const { seriesId } = await params;
    console.log('Series ID:', seriesId);
    
    // For now, just parse the form data without using formidable
    const formData = await request.formData();
    console.log('FormData received');
    
    // Extract the episode data
    const episodeDataStr = formData.get('episodeData') as string;
    const episodeData = JSON.parse(episodeDataStr);
    console.log('Episode data:', episodeData);
    
    // Get files
    const videoFile = formData.get('video') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    
    console.log('Files received:', {
      video: videoFile?.name,
      audio: audioFile?.name,
      thumbnail: thumbnailFile?.name
    });
    
    // Load existing series data from Firebase
    const series = await getSeriesFirebase(seriesId);
    
    if (!series) {
      console.error('Series not found in Firebase:', seriesId);
      return NextResponse.json({ success: false, error: 'Series not found' }, { status: 404 });
    }
    
    console.log('Loaded series from Firebase:', series.title);
    // Get episode number from request or auto-generate
    const requestedEpisodeNumber = episodeData.episodeNumber;
    let episodeNumber: number;
    
    if (requestedEpisodeNumber) {
      // Check for duplicate episode numbers
      const existingEpisode = series.episodes.find((ep: any) => ep.episodeNumber === requestedEpisodeNumber);
      if (existingEpisode) {
        return NextResponse.json({ 
          success: false, 
          error: `Episode ${requestedEpisodeNumber} already exists in this series` 
        }, { status: 400 });
      }
      episodeNumber = requestedEpisodeNumber;
    } else {
      // Auto-generate next available episode number
      const existingNumbers = series.episodes.map((ep: any) => ep.episodeNumber);
      episodeNumber = Math.max(0, ...existingNumbers) + 1;
    }
    
    const episodeId = `episode-${uuidv4()}`;
    
    // Since Firebase Admin Storage is not configured, we'll use local storage
    // but keep the Firebase Firestore integration for metadata
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', seriesId);
    await fs.mkdir(uploadsDir, { recursive: true });
    
    let videoPath = '';
    let audioPath = '';
    let thumbnailPath = '';
    
    // Helper function to upload to Firebase Storage when admin is configured
    async function uploadToFirebaseStorage(file: File, folder: string, fileName: string): Promise<string> {
      if (!adminStorage) {
        // Fallback to local storage
        const ext = file.name.split('.').pop() || 'bin';
        const localFileName = fileName;
        const localFilePath = path.join(uploadsDir, localFileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(localFilePath, buffer);
        return `/uploads/${seriesId}/${localFileName}`;
      }
      
      const bucket = adminStorage.bucket();
      const filePath = `${folder}/${fileName}`;
      const fileRef = bucket.file(filePath);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            seriesId,
            episodeNumber: episodeNumber.toString(),
            uploadedAt: new Date().toISOString()
          }
        }
      });
      
      // Make file publicly accessible
      await fileRef.makePublic();
      
      // Return the public URL
      return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }
    
    // Upload video file
    if (videoFile) {
      const videoExt = videoFile.name.split('.').pop() || 'mp4';
      const videoFileName = `episode-${episodeNumber}-video.${videoExt}`;
      videoPath = await uploadToFirebaseStorage(videoFile, `videos/${seriesId}`, videoFileName);
    }
    
    // Upload audio file
    if (audioFile) {
      const audioExt = audioFile.name.split('.').pop() || 'mp3';
      const audioFileName = `episode-${episodeNumber}-audio.${audioExt}`;
      audioPath = await uploadToFirebaseStorage(audioFile, `audio/${seriesId}`, audioFileName);
    }
    
    // Upload thumbnail file
    if (thumbnailFile) {
      const thumbnailExt = thumbnailFile.name.split('.').pop() || 'jpg';
      const thumbnailFileName = `episode-${episodeNumber}-thumbnail.${thumbnailExt}`;
      thumbnailPath = await uploadToFirebaseStorage(thumbnailFile, `thumbnails/${seriesId}`, thumbnailFileName);
    }
    
    // Create new episode
    const newEpisode = {
      episodeId,
      episodeNumber: episodeNumber,
      title: episodeData.title,
      description: episodeData.description || '',
      videoPath,
      audioPath,
      thumbnailPath,
      duration: episodeData.duration || '',
      credits: episodeData.credits || 50,
      isFree: episodeData.isFree || false,
    };
    
    // Add episode to series using Firebase
    const episodeToAdd = {
      episodeNumber: newEpisode.episodeNumber,
      title: newEpisode.title,
      description: newEpisode.description,
      videoPath: newEpisode.videoPath,
      audioPath: newEpisode.audioPath,
      thumbnailPath: newEpisode.thumbnailPath,
      duration: newEpisode.duration,
      credits: newEpisode.credits,
      isFree: newEpisode.isFree
    };
    
    const success = await addEpisodeFirebase(seriesId, episodeToAdd);
    
    if (!success) {
      throw new Error('Failed to add episode to Firebase');
    }
    
    console.log('Episode added successfully:', newEpisode);
    
    return NextResponse.json({ 
      success: true, 
      episode: newEpisode,
      message: 'Episode added successfully' 
    });
    
  } catch (error: any) {
    console.error('Error in simple episode endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add episode'
      },
      { status: 500 }
    );
  }
}