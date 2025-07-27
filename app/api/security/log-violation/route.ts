import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, violationType, contentId, timestamp } = await request.json();

    if (!userId || !violationType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get additional information
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Log the violation
    if (serverDb) {
      await addDoc(collection(serverDb, 'security-violations'), {
        userId,
        violationType,
        contentId,
        timestamp,
        userAgent,
        ip,
        createdAt: serverTimestamp()
      });
    }

    // You could also implement rate limiting or blocking logic here
    // For example, block user after X violations

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Security logging error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log violation' },
      { status: 500 }
    );
  }
}