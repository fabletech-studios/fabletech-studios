import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Media API is working',
    test_paths: {
      original: '/uploads/test.jpg',
      converted: '/api/media/test.jpg'
    }
  });
}