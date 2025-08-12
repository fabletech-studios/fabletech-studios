import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check email configuration
  const config = {
    host: process.env.EMAIL_HOST ? '✓ Set' : '✗ Missing',
    port: process.env.EMAIL_PORT ? '✓ Set' : '✗ Missing', 
    user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
    password: process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Missing',
  };
  
  return NextResponse.json({
    status: 'Email Configuration Check',
    config,
    values: {
      host: process.env.EMAIL_HOST || 'not set',
      port: process.env.EMAIL_PORT || 'not set',
      user: process.env.EMAIL_USER || 'not set',
      password: process.env.EMAIL_PASSWORD ? '***hidden***' : 'not set'
    }
  });
}