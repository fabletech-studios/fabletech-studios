import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendPasswordResetEmail } from '@/lib/email/email-service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, but we don't reveal this for security
      console.log('User not found:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the reset token in Firestore
    await adminDb.collection('passwordResets').doc(resetToken).set({
      uid: userRecord.uid,
      email: email,
      token: resetToken,
      createdAt: new Date(),
      expiresAt: resetExpires,
      used: false
    });

    // Generate the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabletech.studio'}/reset-password?token=${resetToken}`;

    // Send the custom email using your IONOS service
    const emailSent = await sendPasswordResetEmail(email, resetLink);

    if (emailSent) {
      console.log('Password reset email sent successfully to:', email);
    } else {
      console.error('Failed to send password reset email to:', email);
      // Still return success for security, but log the issue
    }

    // Always return success for security (don't reveal if email exists or if sending failed)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
      // For testing/debugging only - remove in production
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}