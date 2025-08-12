import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name, isGoogleAuth } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Send the welcome email
    const result = await sendWelcomeEmail(email, name, isGoogleAuth);
    
    if (result) {
      return NextResponse.json({ 
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      // Don't fail the signup if email fails
      console.error('Failed to send welcome email to:', email);
      return NextResponse.json({ 
        success: false,
        message: 'Email sending failed but account created'
      });
    }
  } catch (error: any) {
    console.error('Welcome email error:', error);
    // Don't fail the signup if email fails
    return NextResponse.json({ 
      success: false,
      error: error.message 
    });
  }
}