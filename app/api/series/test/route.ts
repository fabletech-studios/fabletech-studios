import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Series API test endpoint working',
    routes: {
      banner: '/api/series/banner exists',
      create: '/api/series/create exists'
    }
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST method working'
  });
}