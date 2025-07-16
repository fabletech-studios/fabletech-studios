import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetFirebase } from '@/lib/firebase/customer-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetFirebase(email);

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
      // In production, Firebase will send the email automatically
      firebaseSent: result.success
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}