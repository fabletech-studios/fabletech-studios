import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
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
    const transporter = nodemailer.createTransporter({
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