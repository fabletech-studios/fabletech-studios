import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Temporary storage for chunks
const TEMP_DIR = '/tmp/uploads';

// Initialize chunk upload
export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, chunkSize = 4 * 1024 * 1024 } = await request.json(); // 4MB chunks
    
    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const uploadId = uuidv4();
    const totalChunks = Math.ceil(fileSize / chunkSize);
    
    // Create temp directory if it doesn't exist
    if (!existsSync(TEMP_DIR)) {
      await mkdir(TEMP_DIR, { recursive: true });
    }

    return NextResponse.json({
      success: true,
      uploadId,
      chunkSize,
      totalChunks,
      instructions: 'Upload each chunk to PUT /api/upload/chunk/{uploadId}/{chunkIndex}'
    });
  } catch (error) {
    console.error('Error initializing chunk upload:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    );
  }
}

// Upload individual chunk
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const uploadId = pathParts[pathParts.length - 2];
    const chunkIndex = parseInt(pathParts[pathParts.length - 1]);
    
    if (!uploadId || isNaN(chunkIndex)) {
      return NextResponse.json(
        { error: 'Invalid upload ID or chunk index' },
        { status: 400 }
      );
    }

    const chunk = await request.arrayBuffer();
    const chunkPath = path.join(TEMP_DIR, uploadId, `chunk_${chunkIndex}`);
    
    // Create directory for this upload
    const uploadDir = path.join(TEMP_DIR, uploadId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write chunk to disk
    await writeFile(chunkPath, Buffer.from(chunk));
    
    return NextResponse.json({
      success: true,
      uploadId,
      chunkIndex,
      size: chunk.byteLength
    });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return NextResponse.json(
      { error: 'Failed to upload chunk' },
      { status: 500 }
    );
  }
}