import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - you should add proper authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminStorage) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    console.log('Setting CORS configuration for Firebase Storage...');
    
    const bucket = adminStorage.bucket();
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'x-goog-*']
      }
    ]);
    
    // Verify the configuration
    const [metadata] = await bucket.getMetadata();
    
    return NextResponse.json({
      success: true,
      message: 'CORS configuration set successfully',
      cors: metadata.cors
    });
    
  } catch (error: any) {
    console.error('Error setting CORS:', error);
    return NextResponse.json(
      { error: 'Failed to set CORS', details: error.message },
      { status: 500 }
    );
  }
}