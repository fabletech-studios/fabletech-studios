import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Dynamic import for nodemailer
    const nodemailerModule = await import('nodemailer');
    
    // Debug what's imported
    const availableKeys = Object.keys(nodemailerModule);
    console.log('Nodemailer module keys:', availableKeys);
    
    // Try different ways to access createTransporter
    let createTransporter: any;
    
    if (typeof nodemailerModule.createTransporter === 'function') {
      createTransporter = nodemailerModule.createTransporter;
    } else if (nodemailerModule.default && typeof nodemailerModule.default.createTransporter === 'function') {
      createTransporter = nodemailerModule.default.createTransporter;
    } else if ((nodemailerModule as any).nodemailer && typeof (nodemailerModule as any).nodemailer.createTransporter === 'function') {
      createTransporter = (nodemailerModule as any).nodemailer.createTransporter;
    } else {
      // Return debug info if we can't find createTransporter
      return NextResponse.json({
        success: false,
        error: 'Cannot find createTransporter function',
        debug: {
          keys: availableKeys,
          hasDefault: !!nodemailerModule.default,
          defaultType: typeof nodemailerModule.default,
          hasCreateTransporter: typeof nodemailerModule.createTransporter,
          moduleType: typeof nodemailerModule
        }
      });
    }
    
    // Check if config exists
    if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_USER) {
      return NextResponse.json({
        success: false,
        error: 'Email configuration missing',
        details: {
          user: process.env.EMAIL_USER ? 'Set' : 'Missing',
          password: process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'
        }
      });
    }

    // Try to create transporter
    const transporter = createTransporter({
      host: 'smtp.ionos.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Try to verify connection
    try {
      await transporter.verify();
      return NextResponse.json({
        success: true,
        message: 'SMTP connection successful!',
        config: {
          host: 'smtp.ionos.com',
          port: 587,
          user: process.env.EMAIL_USER
        }
      });
    } catch (verifyError: any) {
      return NextResponse.json({
        success: false,
        error: 'SMTP verification failed',
        details: {
          message: verifyError.message,
          code: verifyError.code,
          response: verifyError.response,
          command: verifyError.command
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create transporter',
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}