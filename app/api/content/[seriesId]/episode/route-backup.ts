import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

async function parseForm(req: NextRequest) {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  
  if (!reader) {
    throw new Error('No request body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  const stream = Readable.from(buffer);
  
  const form = formidable({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 500 * 1024 * 1024, // 500MB
  });

  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(stream as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  console.log('Episode POST endpoint called');
  
  try {
    const { seriesId } = await params;
    console.log('Series ID:', seriesId);
    
    const { fields, files } = await parseForm(request);
    console.log('Fields:', fields);
    console.log('Files:', Object.keys(files));

    // Load existing series data
    const contentFile = path.join(process.cwd(), 'data', 'content.json');
    let contentData = { series: [] };
    
    try {
      const data = await fs.readFile(contentFile, 'utf-8');
      contentData = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, use default
    }

    // Find the series
    const seriesIndex = contentData.series.findIndex((s: any) => s.id === seriesId);
    if (seriesIndex === -1) {
      return NextResponse.json({ success: false, error: 'Series not found' }, { status: 404 });
    }

    const series = contentData.series[seriesIndex];
    
    // Parse episode metadata
    const episodeData = JSON.parse(
      Array.isArray(fields.episodeData) ? fields.episodeData[0] : fields.episodeData
    );

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', seriesId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Determine next episode number
    const nextEpisodeNumber = series.episodes.length + 1;
    const episodeId = `episode-${uuidv4()}`;

    // Process files
    let videoPath = '';
    let audioPath = '';
    let thumbnailPath = '';

    // Video file
    if (files.video) {
      const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
      const videoExt = path.extname(videoFile.originalFilename || '.mp4');
      const videoFileName = `episode-${nextEpisodeNumber}-video${videoExt}`;
      const newVideoPath = path.join(uploadsDir, videoFileName);
      await fs.rename(videoFile.filepath, newVideoPath);
      videoPath = `/uploads/${seriesId}/${videoFileName}`;
    }

    // Audio file
    if (files.audio) {
      const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
      const audioExt = path.extname(audioFile.originalFilename || '.mp3');
      const audioFileName = `episode-${nextEpisodeNumber}-audio${audioExt}`;
      const newAudioPath = path.join(uploadsDir, audioFileName);
      await fs.rename(audioFile.filepath, newAudioPath);
      audioPath = `/uploads/${seriesId}/${audioFileName}`;
    }

    // Thumbnail file
    if (files.thumbnail) {
      const thumbnailFile = Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail;
      const thumbnailExt = path.extname(thumbnailFile.originalFilename || '.jpg');
      const thumbnailFileName = `episode-${nextEpisodeNumber}-thumbnail${thumbnailExt}`;
      const newThumbnailPath = path.join(uploadsDir, thumbnailFileName);
      await fs.rename(thumbnailFile.filepath, newThumbnailPath);
      thumbnailPath = `/uploads/${seriesId}/${thumbnailFileName}`;
    }

    // Create new episode
    const newEpisode = {
      episodeId,
      episodeNumber: nextEpisodeNumber,
      title: episodeData.title,
      description: episodeData.description || '',
      videoPath,
      audioPath,
      thumbnailPath,
      duration: episodeData.duration || '',
      credits: episodeData.credits || 50,
      isFree: episodeData.isFree || false,
    };

    // Add episode to series
    series.episodes.push(newEpisode);
    
    // Save updated content
    await fs.mkdir(path.dirname(contentFile), { recursive: true });
    await fs.writeFile(contentFile, JSON.stringify(contentData, null, 2));

    return NextResponse.json({ 
      success: true, 
      episode: newEpisode,
      message: 'Episode added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding episode:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add episode',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}