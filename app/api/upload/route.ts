import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAdminAuth } from '@/lib/middleware/admin-auth';
import { apiRateLimit } from '@/lib/middleware/rate-limit';

export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult.rateLimited === false) {
      // Rate limit check passed, add headers later
    } else {
      return rateLimitResult; // Return rate limit error response
    }

    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult; // Return auth error response
    }
    const formData = await request.formData();
    
    // Get form data
    const seriesTitle = formData.get('seriesTitle') as string;
    const seriesDescription = formData.get('seriesDescription') as string;
    const episodes = JSON.parse(formData.get('episodes') as string);
    
    // Generate series ID
    const seriesId = `series-${uuidv4()}`;
    const uploadResults = [];

    // Process each episode
    for (let i = 0; i < episodes.length; i++) {
      const episodeId = `episode-${uuidv4()}`;
      const episodeData = episodes[i];
      
      // Handle video file
      const videoFile = formData.get(`video-${i}`) as File;
      let videoPath = '';
      if (videoFile && videoFile.size > 0) {
        const videoBytes = await videoFile.arrayBuffer();
        const videoBuffer = Buffer.from(videoBytes);
        videoPath = `/uploads/episodes/video/${episodeId}-${videoFile.name}`;
        const videoFilePath = path.join(process.cwd(), 'public', videoPath);
        await writeFile(videoFilePath, videoBuffer);
      }

      // Handle audio file
      const audioFile = formData.get(`audio-${i}`) as File;
      let audioPath = '';
      if (audioFile && audioFile.size > 0) {
        const audioBytes = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(audioBytes);
        audioPath = `/uploads/episodes/audio/${episodeId}-${audioFile.name}`;
        const audioFilePath = path.join(process.cwd(), 'public', audioPath);
        await writeFile(audioFilePath, audioBuffer);
      }

      // Handle thumbnail
      const thumbnailFile = formData.get(`thumbnail-${i}`) as File;
      let thumbnailPath = '';
      if (thumbnailFile && thumbnailFile.size > 0) {
        const thumbnailBytes = await thumbnailFile.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailBytes);
        thumbnailPath = `/uploads/episodes/thumbnails/${episodeId}-${thumbnailFile.name}`;
        const thumbnailFilePath = path.join(process.cwd(), 'public', thumbnailPath);
        await writeFile(thumbnailFilePath, thumbnailBuffer);
      }

      uploadResults.push({
        episodeId,
        episodeNumber: i + 1,
        title: episodeData.title,
        videoPath,
        audioPath,
        thumbnailPath,
        credits: episodeData.credits || 0,
        isFree: episodeData.isFree || false,
      });
    }

    // Save series metadata (in production, save to database)
    const seriesData = {
      id: seriesId,
      title: seriesTitle,
      description: seriesDescription,
      episodes: uploadResults,
      createdAt: new Date().toISOString(),
    };

    // Save to JSON file (temporary solution)
    const contentDataPath = path.join(process.cwd(), 'public/uploads/series', `${seriesId}.json`);
    await writeFile(contentDataPath, JSON.stringify(seriesData, null, 2));

    return NextResponse.json({
      success: true,
      seriesId,
      message: 'Series uploaded successfully',
      data: seriesData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}