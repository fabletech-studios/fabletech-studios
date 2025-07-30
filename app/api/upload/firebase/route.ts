import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

// This endpoint generates signed URLs for direct Firebase Storage uploads
// This bypasses Vercel's size limits by uploading directly from client to Firebase

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (you should add proper auth check)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { fileName, contentType, fileSize } = await request.json();
    
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique file name with year/month structure
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const filePath = `videos/${year}/${month}/${uniqueFileName}`;

    // Get a reference to the file
    const file = adminStorage.bucket().file(filePath);

    // Generate a signed URL for uploading
    const [uploadUrl] = await file.generateSignedPostPolicyV4({
      expires: Date.now() + 30 * 60 * 1000, // 30 minutes
      conditions: [
        ['content-length-range', 0, 500 * 1024 * 1024], // Max 500MB
        ['starts-with', '$Content-Type', contentType.split('/')[0]], // Allow any video/audio type
      ],
      fields: {
        'Content-Type': contentType,
        'x-goog-meta-source': 'fabletech-upload',
        'x-goog-meta-uploadedBy': 'admin', // Track who uploaded
      },
    });

    // Generate a public URL for accessing the file after upload
    const publicUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${filePath}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl.url,
      fields: uploadUrl.fields,
      filePath,
      publicUrl,
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// Get upload status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing filePath parameter' },
        { status: 400 }
      );
    }

    const file = adminStorage.bucket().file(filePath);
    const [exists] = await file.exists();
    
    if (exists) {
      const [metadata] = await file.getMetadata();
      return NextResponse.json({
        success: true,
        exists: true,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        publicUrl: `https://storage.googleapis.com/${adminStorage.bucket().name}/${filePath}`,
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error checking upload status:', error);
    return NextResponse.json(
      { error: 'Failed to check upload status' },
      { status: 500 }
    );
  }
}