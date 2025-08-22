import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendPasswordResetEmail, sendPurchaseConfirmationEmail } from '@/lib/email/email-service';
import { adminAuth } from '@/lib/firebase/admin';

// Simple admin check - you should replace this with your actual admin verification
const ADMIN_EMAIL = 'admin@fabletech.studio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipientEmail, adminPassword } = body;
    
    // Basic validation
    if (!type || !recipientEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify admin password (basic check - enhance this for production)
    // For now, we'll just check if a password was provided
    // In production, you should verify against Firebase Auth or a secure admin system
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin password' },
        { status: 401 }
      );
    }
    
    // Check if email configuration is complete
    if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_USER || !process.env.EMAIL_HOST) {
      const missing = [];
      if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST');
      if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
      if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Email configuration incomplete. Missing: ${missing.join(', ')}. Please add these to .env.local`
        },
        { status: 500 }
      );
    }
    
    let result = false;
    let emailType = '';
    
    switch (type) {
      case 'welcome':
        emailType = 'Welcome';
        result = await sendWelcomeEmail(
          recipientEmail,
          'Test User',
          false
        );
        break;
        
      case 'reset':
        emailType = 'Password Reset';
        // Generate a fake reset link for testing
        const resetLink = `https://www.fabletech.studio/reset-password?token=test_token_${Date.now()}`;
        result = await sendPasswordResetEmail(
          recipientEmail,
          resetLink
        );
        break;
        
      case 'purchase':
        emailType = 'Purchase Confirmation';
        result = await sendPurchaseConfirmationEmail(
          recipientEmail,
          'Test User',
          100, // credits
          9.99 // amount
        );
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid email type' },
          { status: 400 }
        );
    }
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `${emailType} email sent successfully to ${recipientEmail}. Check your inbox!`
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to send ${emailType} email. Check server logs for details.`
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while sending the test email'
      },
      { status: 500 }
    );
  }
}