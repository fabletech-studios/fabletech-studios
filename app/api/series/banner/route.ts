import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { updateSeriesFirebase } from '@/lib/firebase/content-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('banner') as File;
    const seriesId = formData.get('seriesId') as string;

    if (!file || !seriesId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Create series directory if it doesn't exist
    const seriesDir = path.join(process.cwd(), 'public', 'uploads', seriesId);
    await mkdir(seriesDir, { recursive: true });

    // Generate filename with timestamp to avoid caching issues
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `banner-${Date.now()}.${extension}`;
    const filepath = path.join(seriesDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const bannerUrl = `/uploads/${seriesId}/${filename}`;

    // Update series document in Firestore using the content service
    const updateSuccess = await updateSeriesFirebase(seriesId, {
      bannerUrl: bannerUrl
    });

    if (!updateSuccess) {
      console.error('Failed to update series in Firestore');
    }

    return NextResponse.json({ 
      success: true, 
      bannerUrl: bannerUrl
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload banner' 
    }, { status: 500 });
  }
}