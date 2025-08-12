import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
async function getAdminAuth() {
  try {
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    return await getAdminAuth();
  } catch (error) {
    console.error('Failed to get admin auth:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with a secret key
    const { email, secretKey } = await request.json();
    
    // Simple security check - you should use a strong secret
    if (secretKey !== 'set-admin-2025-fabletech') {
      return NextResponse.json(
        { success: false, error: 'Invalid secret key' },
        { status: 403 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const adminAuth = await getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, error: 'Admin auth not initialized' },
        { status: 500 }
      );
    }
    
    // Get user by email
    const user = await adminAuth.getUserByEmail(email);
    console.log(`Found user: ${user.uid} - ${user.email}`);
    
    // Set custom claims
    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin'
    });
    
    console.log(`Successfully set admin role for ${email}`);
    
    // Verify the claims were set
    const updatedUser = await adminAuth.getUser(user.uid);
    
    return NextResponse.json({
      success: true,
      message: `Admin role set for ${email}`,
      uid: user.uid,
      customClaims: updatedUser.customClaims
    });
    
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set admin role' },
      { status: 500 }
    );
  }
}