import { NextRequest, NextResponse } from 'next/server';

// Configure route segment
export const runtime = 'nodejs';
export const maxDuration = 60;

// Dynamic import to avoid initialization issues
async function getAdminServices() {
  try {
    const { adminStorage, adminDb } = await import('@/lib/firebase/admin');
    return { adminStorage, adminDb };
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return { adminStorage: null, adminDb: null };
  }
}

export async function POST(request: NextRequest) {
  console.log('Banner upload endpoint called');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  
  try {
    // Check authorization (optional in development)
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // In production, require authorization
    if (process.env.NODE_ENV === 'production' && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { adminStorage, adminDb } = await getAdminServices();
    
    if (!adminStorage || !adminDb) {
      console.error('Firebase Admin services not available');
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized. Please check environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('banner') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get current banner to delete old one if exists
    try {
      const currentBannerDoc = await adminDb.collection('settings').doc('banner').get();
      if (currentBannerDoc.exists) {
        const currentBanner = currentBannerDoc.data();
        if (currentBanner?.storagePath) {
          try {
            const bucket = adminStorage.bucket();
            await bucket.file(currentBanner.storagePath).delete();
          } catch (deleteError) {
            console.log('Old banner file not found or already deleted');
          }
        }
      }
    } catch (error) {
      console.log('No existing banner to delete');
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `banner-${timestamp}.${extension}`;
    const storagePath = `banners/${filename}`;

    // Upload to Firebase Storage using Admin SDK
    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileUpload = bucket.file(storagePath);
    
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name
        }
      },
      resumable: false,
      validation: false
    });
    
    // Make the file publicly accessible
    await fileUpload.makePublic();
    
    // Get download URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Save banner settings to Firestore
    const bannerSettings = {
      url: downloadURL,
      storagePath: storagePath,
      filename: filename,
      uploadedAt: new Date(),
      type: 'custom',
      originalName: file.name,
      size: file.size,
      contentType: file.type
    };

    await adminDb.collection('settings').doc('banner').set(bannerSettings);

    return NextResponse.json({
      success: true,
      message: 'Banner uploaded successfully',
      bannerUrl: downloadURL,
      settings: bannerSettings
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload banner' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { adminDb } = await getAdminServices();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const bannerDoc = await adminDb.collection('settings').doc('banner').get();
    
    if (!bannerDoc.exists) {
      return NextResponse.json({
        success: true,
        banner: {
          type: 'gradient',
          url: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      banner: bannerDoc.data()
    });

  } catch (error) {
    console.error('Get banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get banner settings' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { adminStorage, adminDb } = await getAdminServices();
    
    if (!adminStorage || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Get current banner
    const bannerDoc = await adminDb.collection('settings').doc('banner').get();
    
    if (bannerDoc.exists) {
      const banner = bannerDoc.data();
      
      // Delete from storage if exists
      if (banner?.storagePath) {
        try {
          const bucket = adminStorage.bucket();
          await bucket.file(banner.storagePath).delete();
        } catch (deleteError) {
          console.log('Banner file not found or already deleted');
        }
      }
    }

    // Reset to gradient
    const defaultBanner = {
      type: 'gradient',
      url: null,
      resetAt: new Date()
    };

    await adminDb.collection('settings').doc('banner').set(defaultBanner);

    return NextResponse.json({
      success: true,
      message: 'Banner reset to default gradient',
      banner: defaultBanner
    });

  } catch (error) {
    console.error('Reset banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset banner' },
      { status: 500 }
    );
  }
}