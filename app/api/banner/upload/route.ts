import { NextRequest, NextResponse } from 'next/server';
import { serverStorage, serverDb } from '@/lib/firebase/server-config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check authorization (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!serverStorage || !serverDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
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
      const currentBannerDoc = await getDoc(doc(serverDb, 'settings', 'banner'));
      if (currentBannerDoc.exists()) {
        const currentBanner = currentBannerDoc.data();
        if (currentBanner.storagePath) {
          try {
            await deleteObject(ref(serverStorage, currentBanner.storagePath));
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

    // Upload to Firebase Storage
    const storageRef = ref(serverStorage, storagePath);
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await uploadBytes(storageRef, arrayBuffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

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

    await setDoc(doc(serverDb, 'settings', 'banner'), bannerSettings);

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
    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const bannerDoc = await getDoc(doc(serverDb, 'settings', 'banner'));
    
    if (!bannerDoc.exists()) {
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
    if (!serverStorage || !serverDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    // Get current banner
    const bannerDoc = await getDoc(doc(serverDb, 'settings', 'banner'));
    
    if (bannerDoc.exists()) {
      const banner = bannerDoc.data();
      
      // Delete from storage if exists
      if (banner.storagePath) {
        try {
          await deleteObject(ref(serverStorage, banner.storagePath));
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

    await setDoc(doc(serverDb, 'settings', 'banner'), defaultBanner);

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