import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

const ADMIN_UIDS = [
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2',
  'BAhEHbxh31MgdhAQJza3SVJ7cIh2',
];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID and check admin
    let adminUid: string;
    try {
      const extracted = extractUidFromToken(token);
      adminUid = extracted.uid;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_UIDS.includes(adminUid)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, episodes } = body;

    if (!customerId || !episodes || !Array.isArray(episodes)) {
      return NextResponse.json({ error: 'Missing customerId or episodes array' }, { status: 400 });
    }

    // Use Admin SDK to bypass security rules
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin SDK not available' }, { status: 500 });
    }

    // Get current customer data
    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerDoc = await customerRef.get();
    
    if (!customerDoc.exists) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerData = customerDoc.data();
    const currentUnlocked = customerData?.unlockedEpisodes || [];
    
    // Add missing episodes
    const newEpisodes = [];
    for (const episode of episodes) {
      const exists = currentUnlocked.some((ep: any) => 
        ep.seriesId === episode.seriesId && ep.episodeNumber === episode.episodeNumber
      );
      
      if (!exists) {
        newEpisodes.push({
          seriesId: episode.seriesId,
          episodeNumber: episode.episodeNumber,
          unlockedAt: new Date()
        });
      }
    }

    if (newEpisodes.length === 0) {
      return NextResponse.json({ 
        message: 'No new episodes to add - all specified episodes already unlocked',
        currentUnlocked: currentUnlocked.length
      });
    }

    // Update customer document
    await customerRef.update({
      unlockedEpisodes: [...currentUnlocked, ...newEpisodes],
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Added ${newEpisodes.length} episodes to customer ${customerId}`,
      addedEpisodes: newEpisodes,
      totalUnlocked: currentUnlocked.length + newEpisodes.length
    });

  } catch (error: any) {
    console.error('Recover episodes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}