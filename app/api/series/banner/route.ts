import { NextRequest, NextResponse } from 'next/server';
import { updateSeriesFirebase } from '@/lib/firebase/content-service';

// Configure route segment
export const maxDuration = 60;

// Dynamic import to avoid initialization issues
async function getAdminStorage() {
  try {
    const { getAdminStorage } = await import('@/lib/firebase/admin');
    return await getAdminStorage();
  } catch (error) {
    console.error('Failed to import admin storage:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add detailed logging
    console.log('Banner upload endpoint called');
    console.log('Environment variables check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      projectIdPrefix: process.env.FIREBASE_PROJECT_ID?.substring(0, 10),
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    
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

    console.log('Upload request details:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      seriesId: seriesId
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB max for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: `File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB, received ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
      }, { status: 413 });
    }

    // Get admin storage dynamically
    const adminStorage = await getAdminStorage();

    // Check if Firebase Storage is available
    if (!adminStorage) {
      console.error('Firebase Admin Storage not initialized');
      console.error('Environment check:', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Storage service not available. Please configure Firebase Admin SDK.',
        debug: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
          hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        }
      }, { status: 503 });
    }

    try {
      // Upload to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      
      const bucket = adminStorage.bucket();
      console.log('Got storage bucket:', bucket.name);
      
      const extension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const filename = `banners/${seriesId}/banner-${timestamp}.${extension}`;
      
      console.log('Preparing to upload file:', {
        filename: filename,
        size: file.size,
        type: file.type
      });
      
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileUpload = bucket.file(filename);
      
      // Upload the file with retry logic
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (uploadAttempts < maxAttempts) {
        try {
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}`);
          
          await fileUpload.save(fileBuffer, {
            metadata: {
              contentType: file.type,
              metadata: {
                seriesId: seriesId,
                originalName: file.name,
                uploadedAt: new Date().toISOString()
              }
            },
            resumable: false, // Disable resumable uploads for smaller files
            validation: false // Skip MD5 validation for faster uploads
          });
          
          console.log('File uploaded successfully to storage');
          break;
        } catch (uploadError: any) {
          lastError = uploadError;
          console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError.message);
          
          if (uploadAttempts < maxAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }
      }
      
      if (uploadAttempts >= maxAttempts && lastError) {
        throw lastError;
      }
      
      // Make the file publicly accessible
      console.log('Making file public...');
      try {
        await fileUpload.makePublic();
      } catch (publicError: any) {
        console.error('Failed to make file public:', publicError.message);
        // Continue anyway - the file might still be accessible
      }
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      console.log('File uploaded successfully:', publicUrl);
      
      // Update series document in Firestore
      console.log('Updating series document in Firestore...');
      try {
        const updateSuccess = await updateSeriesFirebase(seriesId, {
          bannerUrl: publicUrl
        });

        if (!updateSuccess) {
          console.error('Failed to update series in Firestore');
          // Don't fail the upload - the file is already in storage
        }
      } catch (firestoreError: any) {
        console.error('Firestore update error:', firestoreError.message);
        // Don't fail the upload - the file is already in storage
      }

      return NextResponse.json({ 
        success: true, 
        bannerUrl: publicUrl,
        storage: 'firebase',
        filename: filename
      });
      
    } catch (storageError: any) {
      console.error('Firebase Storage error:', storageError);
      console.error('Storage error details:', {
        message: storageError.message,
        code: storageError.code,
        details: storageError.details,
        stack: storageError.stack
      });
      
      // Check for specific error types
      if (storageError.code === 'PERMISSION_DENIED') {
        return NextResponse.json({ 
          success: false, 
          error: 'Storage permission denied. Please check Firebase Storage rules and service account permissions.',
          details: storageError.message
        }, { status: 403 });
      }
      
      if (storageError.code === 'BUCKET_NOT_FOUND' || storageError.message?.includes('does not exist') || storageError.message?.includes('not found')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Storage bucket not found. Please verify FIREBASE_STORAGE_BUCKET configuration.',
          details: storageError.message,
          configuredBucket: process.env.FIREBASE_STORAGE_BUCKET,
          suggestions: [
            'Try format: projectId.appspot.com (e.g., fabletech-studios-897f1.appspot.com)',
            'Try format: projectId.firebasestorage.app (e.g., fabletech-studios-897f1.firebasestorage.app)', 
            'Ensure the bucket exists in Firebase Console > Storage',
            'Check that the service account has Storage Admin permissions'
          ]
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload to Firebase Storage',
        details: storageError.message,
        code: storageError.code
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

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Banner upload endpoint is available',
    method: 'POST',
    requirements: {
      fields: {
        banner: 'File (image, max 10MB)',
        seriesId: 'String (series ID)'
      },
      contentType: 'multipart/form-data'
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}