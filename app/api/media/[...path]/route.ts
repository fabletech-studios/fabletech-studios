import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { adminStorage } from '@/lib/firebase/admin';
import { getSeriesEpisode } from '@/lib/firebase/content-service';
import { normalizeEpisode } from '@/lib/utils/episode-utils';

// MIME type mapping
const mimeTypes: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path;
    
    // Check if this is an episode media request (e.g., /api/media/episode-id/video)
    if (pathSegments.length === 2 && (pathSegments[1] === 'video' || pathSegments[1] === 'audio')) {
      const episodeId = pathSegments[0];
      const mediaType = pathSegments[1];
      
      // Fetch episode data from Firestore
      const rawEpisode = await getSeriesEpisode(episodeId);
      if (!rawEpisode) {
        return new NextResponse('Episode not found', { status: 404 });
      }
      
      // Normalize episode data
      const episode = normalizeEpisode(rawEpisode);
      
      // Get the appropriate URL
      const mediaUrl = mediaType === 'video' ? episode.videoUrl : (episode.audioUrl || '');
      
      if (!mediaUrl) {
        return new NextResponse(`No ${mediaType} available`, { status: 404 });
      }
      
      // Check if it's a Firebase Storage path
      if (mediaUrl.startsWith('videos/') || mediaUrl.startsWith('uploads/')) {
        // Serve from Firebase Storage
        if (!adminStorage) {
          return new NextResponse('Storage not configured', { status: 500 });
        }
        
        const file = adminStorage.bucket().file(mediaUrl);
        const [exists] = await file.exists();
        
        if (!exists) {
          return new NextResponse('File not found in storage', { status: 404 });
        }
        
        // Generate a signed URL for streaming
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 6 * 60 * 60 * 1000, // 6 hours
        });
        
        // Redirect to the signed URL
        return NextResponse.redirect(signedUrl);
      }
      
      // If it's an HTTP URL, redirect to it
      if (mediaUrl.startsWith('http')) {
        return NextResponse.redirect(mediaUrl);
      }
    }
    
    // Fall back to local file serving
    const filePath = pathSegments.join('/');
    const fullPath = path.join(process.cwd(), 'public/uploads', filePath);
    
    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Get file extension for MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    try {
      // Read the file
      const fileBuffer = await readFile(fullPath);
      
      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
        },
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return new NextResponse('File not found', { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error serving media file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Support HEAD requests for media validation
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return GET(request, { params });
}