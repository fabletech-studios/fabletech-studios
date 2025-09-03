import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// Dynamic import to avoid initialization issues
async function getAdminStorage() {
  try {
    const { getAdminStorage } = await import('@/lib/firebase/admin');
    return await getAdminStorage();
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return null;
  }
}

// POST - Upload audio file for a node
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; episodeId: string } }
) {
  try {
    const adminStorage = await getAdminStorage();
    
    if (!adminStorage) {
      return NextResponse.json(
        { success: false, error: 'Storage not initialized' },
        { status: 500 }
      );
    }

    const { id: seriesId, episodeId } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nodeId = formData.get('nodeId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `interactive/${seriesId}/${episodeId}/${nodeId}_${uuidv4()}.${fileExtension}`;

    // Get bucket
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);

    // Upload file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          seriesId,
          episodeId,
          nodeId,
          originalName: file.name,
        },
      },
    });

    // Make file public
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      success: true,
      audioUrl: publicUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}