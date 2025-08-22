import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check if admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Admin SDK not initialized. Server configuration issue.' },
        { status: 500 }
      );
    }
    
    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not logged in. Please log in first.' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    const uid = decodedClaims.uid;
    const email = decodedClaims.email;
    
    // Get allowed admin emails from environment variable
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map(e => e.trim()).filter(e => e.length > 0);
    
    // Fallback to single admin email if list not provided
    if (adminEmails.length === 0 && process.env.ADMIN_EMAIL) {
      adminEmails.push(process.env.ADMIN_EMAIL);
    }
    
    // Security check - ensure we have at least one admin email configured
    if (adminEmails.length === 0) {
      console.error('No admin emails configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Admin system not configured properly' },
        { status: 500 }
      );
    }
    
    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Email ${email} is not authorized to be admin`,
          uid: uid 
        },
        { status: 403 }
      );
    }
    
    // Create or update admin document
    await adminDb.collection('admins').doc(uid).set({
      email: email,
      role: 'admin',
      createdAt: new Date(),
      name: decodedClaims.name || 'Admin'
    });
    
    return NextResponse.json({
      success: true,
      message: `Admin role granted successfully to ${email}`,
      uid: uid
    });
    
  } catch (error: any) {
    console.error('Error setting up admin:', error);
    
    // If session cookie verification fails, try a different approach
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-session-cookie') {
      return NextResponse.json({
        success: false,
        error: 'Session expired or invalid. Please log out and log in again.',
        details: 'Go to the site, log out, then log in with Google using bmwhelp.ga@gmail.com'
      }, { status: 401 });
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to setup admin' },
      { status: 500 }
    );
  }
}