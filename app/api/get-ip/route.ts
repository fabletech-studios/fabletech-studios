import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || 
             headersList.get('cf-connecting-ip') || // Cloudflare
             'unknown';
  
  return NextResponse.json({ ip });
}