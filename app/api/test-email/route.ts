import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendEmail } from '@/lib/email/email-service';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    // Test sending a simple email
    const testEmail = process.env.EMAIL_USER || 'admin@fabletech.studio';
    
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email from FableTech Studios',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your FableTech Studios platform.</p>
        <p>If you received this, your IONOS email integration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${testEmail}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send email. Check server logs.' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}