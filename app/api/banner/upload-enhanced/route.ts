import { NextRequest, NextResponse } from 'next/server';

// Configure route segment for larger uploads
export const runtime = 'nodejs';
export const maxDuration = 60;

// Dynamic import to avoid initialization issues
async function getAdminServices() {
  try {
    const { getAdminStorage, getAdminDb } = await import('@/lib/firebase/admin');
    const [adminStorage, adminDb] = await Promise.all([getAdminStorage(), getAdminDb()]);
    return { adminStorage, adminDb };
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return { adminStorage: null, adminDb: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await getAdminServices();
    
    if (!adminDb) {
      // Return default gradient if Firebase is not available
      return NextResponse.json({
        success: true,
        banner: {
          type: 'gradient'
        }
      });
    }

    // Get banner settings from Firestore
    const settingsDoc = await adminDb.collection('settings').doc('banner').get();
    
    if (!settingsDoc.exists) {
      return NextResponse.json({
        success: true,
        banner: {
          type: 'gradient'
        }
      });
    }

    const settings = settingsDoc.data();
    
    return NextResponse.json({
      success: true,
      banner: settings
    });
  } catch (error) {
    console.error('Error fetching banner settings:', error);
    return NextResponse.json({
      success: true,
      banner: {
        type: 'gradient'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  console.log('Enhanced banner upload endpoint called');
  
  try {
    const { adminStorage, adminDb } = await getAdminServices();
    
    if (!adminStorage || !adminDb) {
      console.error('Firebase Admin services not available');
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const type = formData.get('type') as string;
    
    let bannerSettings: any = { type };
    const bucket = adminStorage.bucket();
    
    if (type === 'video') {
      // Handle video uploads
      const desktopVideo = formData.get('desktopVideo') as File;
      const mobileVideo = formData.get('mobileVideo') as File | null;
      
      if (!desktopVideo) {
        return NextResponse.json(
          { success: false, error: 'Desktop video is required' },
          { status: 400 }
        );
      }
      
      // Upload desktop video
      const desktopVideoBuffer = Buffer.from(await desktopVideo.arrayBuffer());
      const desktopVideoFileName = `banners/video-desktop-${Date.now()}.mp4`;
      const desktopVideoFile = bucket.file(desktopVideoFileName);
      
      await desktopVideoFile.save(desktopVideoBuffer, {
        metadata: {
          contentType: desktopVideo.type || 'video/mp4',
          cacheControl: 'public, max-age=3600'
        }
      });
      
      await desktopVideoFile.makePublic();
      bannerSettings.videoUrl = `https://storage.googleapis.com/${bucket.name}/${desktopVideoFileName}`;
      
      // Upload mobile video if provided
      if (mobileVideo) {
        const mobileVideoBuffer = Buffer.from(await mobileVideo.arrayBuffer());
        const mobileVideoFileName = `banners/video-mobile-${Date.now()}.mp4`;
        const mobileVideoFile = bucket.file(mobileVideoFileName);
        
        await mobileVideoFile.save(mobileVideoBuffer, {
          metadata: {
            contentType: mobileVideo.type || 'video/mp4',
            cacheControl: 'public, max-age=3600'
          }
        });
        
        await mobileVideoFile.makePublic();
        bannerSettings.mobileVideoUrl = `https://storage.googleapis.com/${bucket.name}/${mobileVideoFileName}`;
      }
      
    } else if (type === 'custom') {
      // Handle image uploads
      const desktopImage = formData.get('banner') as File;
      const mobileImage = formData.get('mobileBanner') as File | null;
      
      if (!desktopImage) {
        return NextResponse.json(
          { success: false, error: 'Desktop image is required' },
          { status: 400 }
        );
      }
      
      // Upload desktop image
      const desktopImageBuffer = Buffer.from(await desktopImage.arrayBuffer());
      const desktopImageFileName = `banners/image-desktop-${Date.now()}.${desktopImage.name.split('.').pop()}`;
      const desktopImageFile = bucket.file(desktopImageFileName);
      
      await desktopImageFile.save(desktopImageBuffer, {
        metadata: {
          contentType: desktopImage.type || 'image/jpeg',
          cacheControl: 'public, max-age=3600'
        }
      });
      
      await desktopImageFile.makePublic();
      bannerSettings.url = `https://storage.googleapis.com/${bucket.name}/${desktopImageFileName}`;
      bannerSettings.filename = desktopImage.name;
      bannerSettings.size = desktopImage.size;
      
      // Upload mobile image if provided
      if (mobileImage) {
        const mobileImageBuffer = Buffer.from(await mobileImage.arrayBuffer());
        const mobileImageFileName = `banners/image-mobile-${Date.now()}.${mobileImage.name.split('.').pop()}`;
        const mobileImageFile = bucket.file(mobileImageFileName);
        
        await mobileImageFile.save(mobileImageBuffer, {
          metadata: {
            contentType: mobileImage.type || 'image/jpeg',
            cacheControl: 'public, max-age=3600'
          }
        });
        
        await mobileImageFile.makePublic();
        bannerSettings.mobileImageUrl = `https://storage.googleapis.com/${bucket.name}/${mobileImageFileName}`;
      }
    }
    
    // Save settings to Firestore
    bannerSettings.uploadedAt = new Date().toISOString();
    await adminDb.collection('settings').doc('banner').set(bannerSettings);
    
    return NextResponse.json({
      success: true,
      banner: bannerSettings,
      settings: bannerSettings
    });
    
  } catch (error: any) {
    console.error('Error uploading banner:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { adminStorage, adminDb } = await getAdminServices();
    
    if (!adminStorage || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }
    
    // Get current banner settings
    const settingsDoc = await adminDb.collection('settings').doc('banner').get();
    
    if (settingsDoc.exists) {
      const settings = settingsDoc.data();
      const bucket = adminStorage.bucket();
      
      // Delete files from storage
      const filesToDelete = [];
      
      if (settings?.url) {
        const urlParts = settings.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName.startsWith('banners/')) {
          filesToDelete.push(fileName);
        }
      }
      
      if (settings?.mobileImageUrl) {
        const urlParts = settings.mobileImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName.startsWith('banners/')) {
          filesToDelete.push(fileName);
        }
      }
      
      if (settings?.videoUrl) {
        const urlParts = settings.videoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName.startsWith('banners/')) {
          filesToDelete.push(fileName);
        }
      }
      
      if (settings?.mobileVideoUrl) {
        const urlParts = settings.mobileVideoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName.startsWith('banners/')) {
          filesToDelete.push(fileName);
        }
      }
      
      // Delete all files
      for (const fileName of filesToDelete) {
        try {
          await bucket.file(fileName).delete();
          console.log(`Deleted file: ${fileName}`);
        } catch (error) {
          console.error(`Failed to delete file ${fileName}:`, error);
        }
      }
    }
    
    // Reset to gradient
    const defaultSettings = { type: 'gradient' };
    await adminDb.collection('settings').doc('banner').set(defaultSettings);
    
    return NextResponse.json({
      success: true,
      banner: defaultSettings
    });
    
  } catch (error: any) {
    console.error('Error resetting banner:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset banner' },
      { status: 500 }
    );
  }
}