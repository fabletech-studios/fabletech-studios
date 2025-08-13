import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID using standardized function
    let uid: string;
    let userInfo: any;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
      userInfo = extracted.userInfo;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body with restore data
    const body = await request.json();
    const { credits, unlockedEpisodes } = body;

    // Only allow specific UIDs to use this endpoint (for security)
    const allowedUIDs = [
      'IIP8rWwMCeZ62Svix1lcZPyRkRj2', // Your Google OAuth UID
      'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // Your original UID
    ];

    if (!allowedUIDs.includes(uid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use Admin SDK to restore data
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { doc, updateDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customerRef = doc(serverDb, 'customers', uid);
      await updateDoc(customerRef, {
        credits: credits || 750, // Default to 750 if not specified
        unlockedEpisodes: unlockedEpisodes || [
          { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 2, unlockedAt: new Date() },
          { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 3, unlockedAt: new Date() },
          // Add more episodes as needed
        ],
        updatedAt: new Date(),
        restoredAt: new Date(),
        restoredReason: 'Manual restore due to data loss'
      });
    } else {
      // Use Admin SDK
      const customerRef = adminDb.collection('customers').doc(uid);
      await customerRef.update({
        credits: credits || 750,
        unlockedEpisodes: unlockedEpisodes || [
          { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 2, unlockedAt: new Date() },
          { seriesId: 'series-1752726210472-bo9ch9nhe', episodeNumber: 3, unlockedAt: new Date() },
        ],
        updatedAt: new Date(),
        restoredAt: new Date(),
        restoredReason: 'Manual restore due to data loss'
      });
    }

    // Get updated customer data
    const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
    const updatedCustomer = await getFirebaseCustomer(uid);

    return NextResponse.json({
      success: true,
      message: 'Customer data restored',
      customer: {
        uid: updatedCustomer?.uid,
        email: updatedCustomer?.email,
        credits: updatedCustomer?.credits,
        unlockedEpisodes: updatedCustomer?.unlockedEpisodes
      }
    });

  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore customer data' },
      { status: 500 }
    );
  }
}