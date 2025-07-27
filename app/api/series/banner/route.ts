import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import { updateSeriesFirebase } from '@/lib/firebase/content-service';

export async function POST(request: NextRequest) {
  try {
    // Add detailed logging
    console.log('Banner upload endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('banner') as File;
    const seriesId = formData.get('seriesId') as string;

    if (!file || !seriesId) {
      console.error('Missing fields:', { hasFile: !!file, seriesId });
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

    // Check if Firebase Storage is available
    if (!adminStorage) {
      console.error('Firebase Admin Storage not initialized');
      console.error('Environment check:', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
      });
      
      // Fallback to local storage in development/when Firebase is not configured
      if (process.env.NODE_ENV === 'development') {
        const { writeFile, mkdir } = await import('fs/promises');
        const path = await import('path');
        
        const seriesDir = path.join(process.cwd(), 'public', 'uploads', seriesId);
        await mkdir(seriesDir, { recursive: true });
        
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `banner-${Date.now()}.${extension}`;
        const filepath = path.join(seriesDir, filename);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
        
        const bannerUrl = `/uploads/${seriesId}/${filename}`;
        
        await updateSeriesFirebase(seriesId, { bannerUrl });
        
        return NextResponse.json({ 
          success: true, 
          bannerUrl,
          storage: 'local'
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Storage service not available. Please configure Firebase Admin SDK.',
        debug: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
        }
      }, { status: 503 });
    }

    try {
      // Upload to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      
      const bucket = adminStorage.bucket();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `banners/${seriesId}/banner-${Date.now()}.${extension}`;
      
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileUpload = bucket.file(filename);
      
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            seriesId: seriesId,
            originalName: file.name
          }
        }
      });
      
      // Make the file publicly accessible
      await fileUpload.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      console.log('File uploaded successfully:', publicUrl);
      
      // Update series document in Firestore
      const updateSuccess = await updateSeriesFirebase(seriesId, {
        bannerUrl: publicUrl
      });

      if (!updateSuccess) {
        console.error('Failed to update series in Firestore');
      }

      return NextResponse.json({ 
        success: true, 
        bannerUrl: publicUrl,
        storage: 'firebase'
      });
      
    } catch (storageError: any) {
      console.error('Firebase Storage error:', storageError);
      console.error('Storage error details:', {
        message: storageError.message,
        code: storageError.code,
        stack: storageError.stack
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload to Firebase Storage',
        details: storageError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Banner upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload banner',
      details: error.message
    }, { status: 500 });
  }
}