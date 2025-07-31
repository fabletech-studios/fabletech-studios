import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminStorage) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: 'videos/' });
    
    const fileList = files.map(file => ({
      name: file.name,
      size: parseInt(file.metadata.size || '0'),
      created: file.metadata.timeCreated,
      contentType: file.metadata.contentType,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`
    }));

    return NextResponse.json({
      success: true,
      files: fileList,
      count: fileList.length
    });
  } catch (error: any) {
    console.error('Error listing storage files:', error);
    return NextResponse.json(
      { error: 'Failed to list storage files', details: error.message },
      { status: 500 }
    );
  }
}