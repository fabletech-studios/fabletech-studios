import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSeriesFirebase, updateSeriesFirebase } from '@/lib/firebase/content-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string; episodeId: string }> }
) {
  console.log('Episode update endpoint called');
  
  try {
    const { seriesId, episodeId } = await context.params;
    
    // Parse form data
    const formData = await request.formData();
    const episodeDataStr = formData.get('episodeData') as string;
    const episodeData = JSON.parse(episodeDataStr);
    
    // Get files if provided
    const videoFile = formData.get('video') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    
    console.log('Update request for episode:', episodeId);
    console.log('Episode data:', episodeData);
    console.log('Files provided:', {
      video: !!videoFile,
      audio: !!audioFile,
      thumbnail: !!thumbnailFile
    });
    
    // Read series data from Firebase
    const seriesData = await getSeriesFirebase(seriesId);
    
    if (!seriesData) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      );
    }
    
    // Find the episode
    const episodeIndex = seriesData.episodes.findIndex((ep: any) => ep.episodeId === episodeId);
    if (episodeIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    const currentEpisode = seriesData.episodes[episodeIndex];
    
    // Check for episode number conflicts if changing number
    if (episodeData.episodeNumber && episodeData.episodeNumber !== currentEpisode.episodeNumber) {
      const conflictingEpisode = seriesData.episodes.find(
        (ep: any) => ep.episodeNumber === episodeData.episodeNumber && ep.episodeId !== episodeId
      );
      if (conflictingEpisode) {
        return NextResponse.json(
          { success: false, error: `Episode ${episodeData.episodeNumber} already exists` },
          { status: 400 }
        );
      }
    }
    
    // Process file uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', seriesId);
    let videoPath = currentEpisode.videoPath;
    let audioPath = currentEpisode.audioPath;
    let thumbnailPath = currentEpisode.thumbnailPath;
    
    // Update video file if provided
    if (videoFile) {
      // Delete old video file if exists
      if (currentEpisode.videoPath) {
        try {
          const oldVideoPath = path.join(process.cwd(), 'public', currentEpisode.videoPath);
          await fs.unlink(oldVideoPath);
        } catch (err) {
          console.error('Failed to delete old video:', err);
        }
      }
      
      // Save new video
      const videoExt = videoFile.name.split('.').pop() || 'mp4';
      const videoFileName = `episode-${episodeData.episodeNumber || currentEpisode.episodeNumber}-video.${videoExt}`;
      const videoFilePath = path.join(uploadsDir, videoFileName);
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      await fs.writeFile(videoFilePath, videoBuffer);
      videoPath = `/uploads/${seriesId}/${videoFileName}`;
    }
    
    // Update audio file if provided
    if (audioFile) {
      // Delete old audio file if exists
      if (currentEpisode.audioPath) {
        try {
          const oldAudioPath = path.join(process.cwd(), 'public', currentEpisode.audioPath);
          await fs.unlink(oldAudioPath);
        } catch (err) {
          console.error('Failed to delete old audio:', err);
        }
      }
      
      // Save new audio
      const audioExt = audioFile.name.split('.').pop() || 'mp3';
      const audioFileName = `episode-${episodeData.episodeNumber || currentEpisode.episodeNumber}-audio.${audioExt}`;
      const audioFilePath = path.join(uploadsDir, audioFileName);
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      await fs.writeFile(audioFilePath, audioBuffer);
      audioPath = `/uploads/${seriesId}/${audioFileName}`;
    }
    
    // Update thumbnail file if provided
    if (thumbnailFile) {
      // Delete old thumbnail file if exists
      if (currentEpisode.thumbnailPath) {
        try {
          const oldThumbnailPath = path.join(process.cwd(), 'public', currentEpisode.thumbnailPath);
          await fs.unlink(oldThumbnailPath);
        } catch (err) {
          console.error('Failed to delete old thumbnail:', err);
        }
      }
      
      // Save new thumbnail
      const thumbnailExt = thumbnailFile.name.split('.').pop() || 'jpg';
      const thumbnailFileName = `episode-${episodeData.episodeNumber || currentEpisode.episodeNumber}-thumbnail.${thumbnailExt}`;
      const thumbnailFilePath = path.join(uploadsDir, thumbnailFileName);
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await fs.writeFile(thumbnailFilePath, thumbnailBuffer);
      thumbnailPath = `/uploads/${seriesId}/${thumbnailFileName}`;
    }
    
    // Update episode data
    seriesData.episodes[episodeIndex] = {
      ...currentEpisode,
      episodeNumber: episodeData.episodeNumber || currentEpisode.episodeNumber,
      title: episodeData.title || currentEpisode.title,
      description: episodeData.description !== undefined ? episodeData.description : currentEpisode.description,
      duration: episodeData.duration !== undefined ? episodeData.duration : currentEpisode.duration,
      credits: episodeData.credits !== undefined ? episodeData.credits : currentEpisode.credits,
      isFree: episodeData.isFree !== undefined ? episodeData.isFree : currentEpisode.isFree,
      videoPath,
      audioPath,
      thumbnailPath,
    };
    
    // Sort episodes by episode number
    seriesData.episodes.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);
    
    // Save updated series data to Firebase
    const updateSuccess = await updateSeriesFirebase(seriesId, {
      episodes: seriesData.episodes
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
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update episode'
      },
      { status: 500 }
    );
  }
}