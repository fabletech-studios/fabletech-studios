import { NextRequest, NextResponse } from 'next/server';
import { getSeriesFirebase, updateSeriesFirebase } from '@/lib/firebase/content-service';

// Dynamic import to avoid initialization issues
async function getAdminStorage() {
  try {
    const { getAdminStorage } = await import('@/lib/firebase/admin');
    return await getAdminStorage();
  } catch (error) {
    console.error('Failed to import admin storage:', error);
    return null;
  }
}

// Configure route segment to handle large files
export const maxDuration = 300; // 5 minutes for large file uploads

// Helper function to upload file to Firebase Storage
async function uploadToFirebaseStorage(
  file: File,
  seriesId: string,
  episodeNumber: number,
  fileType: 'video' | 'audio' | 'thumbnail'
) {
  const adminStorage = await getAdminStorage();
  
  if (!adminStorage) {
    throw new Error('Firebase Storage not available');
  }
  
  const bucket = adminStorage.bucket();
  const extension = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const filename = `episodes/${seriesId}/episode-${episodeNumber}-${fileType}-${timestamp}.${extension}`;
  
  console.log(`Uploading ${fileType} file:`, {
    filename,
    size: file.size,
    type: file.type
  });
  
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileUpload = bucket.file(filename);
  
  // Upload with retry logic
  let uploadAttempts = 0;
  const maxAttempts = 3;
  let lastError = null;
  
  while (uploadAttempts < maxAttempts) {
    try {
      uploadAttempts++;
      console.log(`Upload attempt ${uploadAttempts}/${maxAttempts} for ${fileType}`);
      
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            seriesId: seriesId,
            episodeNumber: episodeNumber.toString(),
            fileType: fileType,
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        },
        resumable: file.size > 10 * 1024 * 1024, // Use resumable for files > 10MB
        validation: false // Skip MD5 validation for faster uploads
      });
      
      console.log(`${fileType} file uploaded successfully`);
      break;
    } catch (uploadError: any) {
      lastError = uploadError;
      console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError.message);
      
      if (uploadAttempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }
  }
  
  if (uploadAttempts >= maxAttempts && lastError) {
    throw lastError;
  }
  
  // Make the file publicly accessible
  try {
    await fileUpload.makePublic();
  } catch (publicError: any) {
    console.error('Failed to make file public:', publicError.message);
  }
  
  // Return the public URL
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

// Helper function to delete file from Firebase Storage
async function deleteFromFirebaseStorage(filePath: string) {
  const adminStorage = await getAdminStorage();
  
  if (!adminStorage || !filePath) {
    return;
  }
  
  try {
    const bucket = adminStorage.bucket();
    const fileName = filePath.split('/').slice(-4).join('/'); // Extract path from URL
    await bucket.file(fileName).delete();
    console.log('Deleted file:', fileName);
  } catch (error: any) {
    console.error('Failed to delete file:', error.message);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string; episodeId: string }> }
) {
  console.log('Episode update endpoint called');
  
  try {
    const { seriesId, episodeId } = await context.params;
    
    // Check content type and size
    const contentType = request.headers.get('content-type') || '';
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    
    console.log('Request details:', {
      contentType,
      contentLength,
      contentLengthMB: (contentLength / (1024 * 1024)).toFixed(2)
    });
    
    // Validate request size (500MB limit for video/audio files)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (contentLength > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large',
        details: `Maximum file size is ${maxSize / (1024 * 1024)}MB, received ${(contentLength / (1024 * 1024)).toFixed(2)}MB`
      }, { status: 413 });
    }
    
    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError: any) {
      console.error('Form data parse error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse form data',
        details: parseError.message
      }, { status: 400 });
    }
    
    const episodeDataStr = formData.get('episodeData') as string;
    
    if (!episodeDataStr) {
      return NextResponse.json({
        success: false,
        error: 'Missing episode data'
      }, { status: 400 });
    }
    
    let episodeData;
    try {
      episodeData = JSON.parse(episodeDataStr);
    } catch (jsonError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid episode data format'
      }, { status: 400 });
    }
    
    // Get files if provided
    const videoFile = formData.get('video') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    
    console.log('Update request for episode:', episodeId);
    console.log('Episode data:', episodeData);
    console.log('Files provided:', {
      video: videoFile ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB)` : 'none',
      audio: audioFile ? `${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(2)}MB)` : 'none',
      thumbnail: thumbnailFile ? `${thumbnailFile.name} (${(thumbnailFile.size / 1024).toFixed(2)}KB)` : 'none'
    });
    
    // Validate file sizes
    if (videoFile && videoFile.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `Video file too large (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${maxSize / (1024 * 1024)}MB`
      }, { status: 413 });
    }
    
    if (audioFile && audioFile.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `Audio file too large (${(audioFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${maxSize / (1024 * 1024)}MB`
      }, { status: 413 });
    }
    
    if (thumbnailFile && thumbnailFile.size > 10 * 1024 * 1024) { // 10MB limit for images
      return NextResponse.json({
        success: false,
        error: `Thumbnail file too large (${(thumbnailFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB`
      }, { status: 413 });
    }
    
    // Read series data from Firebase
    const seriesData = await getSeriesFirebase(seriesId);
    
    if (!seriesData) {
      return NextResponse.json({
        success: false,
        error: 'Series not found'
      }, { status: 404 });
    }
    
    // Find the episode
    const episodeIndex = seriesData.episodes.findIndex((ep: any) => ep.episodeId === episodeId);
    if (episodeIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Episode not found'
      }, { status: 404 });
    }
    
    const currentEpisode = seriesData.episodes[episodeIndex];
    const episodeNumber = episodeData.episodeNumber || currentEpisode.episodeNumber;
    
    // Check for episode number conflicts if changing number
    if (episodeData.episodeNumber && episodeData.episodeNumber !== currentEpisode.episodeNumber) {
      const conflictingEpisode = seriesData.episodes.find(
        (ep: any) => ep.episodeNumber === episodeData.episodeNumber && ep.episodeId !== episodeId
      );
      if (conflictingEpisode) {
        return NextResponse.json({
          success: false,
          error: `Episode ${episodeData.episodeNumber} already exists`
        }, { status: 400 });
      }
    }
    
    // Process file uploads to Firebase Storage
    let videoPath = currentEpisode.videoPath;
    let audioPath = currentEpisode.audioPath;
    let thumbnailPath = currentEpisode.thumbnailPath;
    
    try {
      // Update video file if provided
      if (videoFile) {
        // Delete old video file if exists
        if (currentEpisode.videoPath) {
          await deleteFromFirebaseStorage(currentEpisode.videoPath);
        }
        
        // Upload new video
        videoPath = await uploadToFirebaseStorage(videoFile, seriesId, episodeNumber, 'video');
      }
      
      // Update audio file if provided
      if (audioFile) {
        // Delete old audio file if exists
        if (currentEpisode.audioPath) {
          await deleteFromFirebaseStorage(currentEpisode.audioPath);
        }
        
        // Upload new audio
        audioPath = await uploadToFirebaseStorage(audioFile, seriesId, episodeNumber, 'audio');
      }
      
      // Update thumbnail file if provided
      if (thumbnailFile) {
        // Delete old thumbnail file if exists
        if (currentEpisode.thumbnailPath) {
          await deleteFromFirebaseStorage(currentEpisode.thumbnailPath);
        }
        
        // Upload new thumbnail
        thumbnailPath = await uploadToFirebaseStorage(thumbnailFile, seriesId, episodeNumber, 'thumbnail');
      }
    } catch (uploadError: any) {
      console.error('File upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload files',
        details: uploadError.message
      }, { status: 500 });
    }
    
    // Update episode data
    seriesData.episodes[episodeIndex] = {
      ...currentEpisode,
      episodeNumber: episodeNumber,
      title: episodeData.title || currentEpisode.title,
      description: episodeData.description !== undefined ? episodeData.description : currentEpisode.description,
      duration: episodeData.duration !== undefined ? episodeData.duration : currentEpisode.duration,
      credits: episodeData.credits !== undefined ? episodeData.credits : currentEpisode.credits,
      isFree: episodeData.isFree !== undefined ? episodeData.isFree : currentEpisode.isFree,
      videoPath,
      audioPath,
      thumbnailPath,
      updatedAt: new Date().toISOString()
    };
    
    // Sort episodes by episode number
    seriesData.episodes.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);
    
    // Save updated series data to Firebase
    const updateSuccess = await updateSeriesFirebase(seriesId, {
      episodes: seriesData.episodes,
      updatedAt: new Date().toISOString()
    });
    
    if (!updateSuccess) {
      throw new Error('Failed to update series in Firebase');
    }
    
    console.log('Episode updated successfully:', seriesData.episodes[episodeIndex]);
    
    return NextResponse.json({
      success: true,
      message: 'Episode updated successfully',
      episode: seriesData.episodes[episodeIndex]
    });
    
  } catch (error: any) {
    console.error('Error updating episode:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update episode',
      details: error.stack
    }, { status: 500 });
  }
}