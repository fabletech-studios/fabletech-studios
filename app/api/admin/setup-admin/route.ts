import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Check if admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized. Server configuration issue.' },
        { status: 500 }
      );
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user email is one of the admin emails
    const adminEmails = [
      'bmwhelp.ga@gmail.com',  // Your actual email
      'oleksandr.myrnyi.work@gmail.com',
      'admin@fabletech.studio'
    ];
    
    if (!adminEmails.includes(decodedToken.email)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to become admin' },
        { status: 403 }
      );
    }
    
    // Create or update admin document
    await adminDb.collection('admins').doc(uid).set({
      email: decodedToken.email,
      role: 'admin',
      createdAt: new Date(),
      name: decodedToken.name || 'Admin'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin role granted successfully'
    });
    
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup admin' },
      { status: 500 }
    );
  }
}