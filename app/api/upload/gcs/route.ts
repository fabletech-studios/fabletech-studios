import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl, generateStreamingUrl, fileExists, getFileMetadata } from '@/lib/google-cloud-storage';

// Generate signed URL for direct upload to Google Cloud Storage
export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, metadata } = await request.json();
    
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = ['video/', 'audio/', 'image/'];
    if (!allowedTypes.some(type => contentType.startsWith(type))) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Generate upload URL
    const uploadData = await generateUploadUrl(fileName, contentType, metadata);

    return NextResponse.json({
      success: true,
      ...uploadData,
    });
  } catch (error) {
    console.error('[GCS Upload] Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// Check upload status and generate streaming URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    const action = searchParams.get('action') || 'status';
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing filePath parameter' },
        { status: 400 }
      );
    }

    if (action === 'stream') {
      // Generate streaming URL
      const expiresInMinutes = parseInt(searchParams.get('expires') || '360');
      const streamingUrl = await generateStreamingUrl(filePath, expiresInMinutes);
      
      return NextResponse.json({
        success: true,
        streamingUrl,
        expires: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      });
    } else {
      // Check file status
      const exists = await fileExists(filePath);
      
      if (exists) {
        const metadata = await getFileMetadata(filePath);
        return NextResponse.json({
          success: true,
          exists: true,
          ...metadata,
        });
      } else {
        return NextResponse.json({
          success: true,
          exists: false,
        });
      }
    }
  } catch (error) {
    console.error('[GCS Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}