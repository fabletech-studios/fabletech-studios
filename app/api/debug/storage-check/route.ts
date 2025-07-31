import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }
    
    if (!adminStorage) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    
    if (exists) {
      const [metadata] = await file.getMetadata();
      return NextResponse.json({
        exists: true,
        size: parseInt(metadata.size || '0'),
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated
      });
    } else {
      return NextResponse.json({
        exists: false
      });
    }
  } catch (error: any) {
    console.error('Error checking storage file:', error);
    return NextResponse.json(
      { error: 'Failed to check storage file', details: error.message },
      { status: 500 }
    );
  }
}