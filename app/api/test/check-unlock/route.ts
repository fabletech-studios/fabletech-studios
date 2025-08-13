import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseCustomer } from '@/lib/firebase/customer-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID from token
    let uid: string;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      if (!uid) {
        throw new Error('No UID in token');
      }
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get customer data
    const customer = await getFirebaseCustomer(uid);
    
    if (!customer) {
      return NextResponse.json({
        status: 'NO_CUSTOMER',
        message: 'Customer document not found',
        uid
      });
    }

    // Check unlocked episodes
    const unlockedCount = customer.unlockedEpisodes?.length || 0;
    const hasUnlockedEpisodes = unlockedCount > 0;
    
    return NextResponse.json({
      status: 'SUCCESS',
      customer: {
        uid: customer.uid,
        email: customer.email,
        credits: customer.credits,
        unlockedEpisodesCount: unlockedCount,
        hasUnlockedEpisodes,
        unlockedEpisodes: customer.unlockedEpisodes || [],
        stats: customer.stats || {}
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message
    }, { status: 500 });
  }
}