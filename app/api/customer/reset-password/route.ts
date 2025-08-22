import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get the reset token from Firestore
    const resetDoc = await adminDb.collection('passwordResets').doc(token).get();
    
    if (!resetDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetData = resetDoc.data()!;

    // Check if token is already used
    if (resetData.used) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const expiresAt = resetData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Update the user's password in Firebase Auth
    await adminAuth.updateUser(resetData.uid, {
      password: newPassword
    });

    // Mark the token as used
    await adminDb.collection('passwordResets').doc(token).update({
      used: true,
      usedAt: new Date()
    });

    // Optional: Clean up old reset tokens for this user
    const oldTokens = await adminDb.collection('passwordResets')
      .where('uid', '==', resetData.uid)
      .where('used', '==', false)
      .get();
    
    const batch = adminDb.batch();
    oldTokens.forEach(doc => {
      if (doc.id !== token) {
        batch.update(doc.ref, { used: true, usedAt: new Date() });
      }
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate a token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the reset token from Firestore
    const resetDoc = await adminDb.collection('passwordResets').doc(token).get();
    
    if (!resetDoc.exists) {
      return NextResponse.json({ valid: false, error: 'Invalid token' });
    }

    const resetData = resetDoc.data()!;

    // Check if token is already used
    if (resetData.used) {
      return NextResponse.json({ valid: false, error: 'Token already used' });
    }

    // Check if token has expired
    const expiresAt = resetData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token expired' });
    }

    return NextResponse.json({
      valid: true,
      email: resetData.email
    });

  } catch (error: any) {
    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}