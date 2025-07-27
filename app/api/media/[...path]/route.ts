import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

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
    // Reconstruct the file path
    const filePath = params.path.join('/');
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