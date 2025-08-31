import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid initialization issues
async function getAdminDb() {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    return await getAdminDb();
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }
    
    const settings = await request.json();
    
    // Validate settings
    if (!settings.type || !['gradient', 'custom', 'video'].includes(settings.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner type' },
        { status: 400 }
      );
    }
    
    // Save to Firestore
    await adminDb.collection('settings').doc('banner').set(settings);
    
    return NextResponse.json({
      success: true,
      message: 'Banner settings saved successfully',
    });
    
  } catch (error: any) {
    console.error('Error saving banner settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}