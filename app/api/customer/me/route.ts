import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseCustomer } from '@/lib/firebase/customer-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify Firebase ID token
    let uid: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = payload.user_id || payload.sub;
      if (!uid) throw new Error('Invalid token');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const customer = await getFirebaseCustomer(uid);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Return customer data
    return NextResponse.json({
      success: true,
      customer: {
        uid: customer.uid,
        email: customer.email,
        name: customer.name,
        credits: customer.credits,
        stats: customer.stats || { episodesUnlocked: 0, creditsSpent: 0 },
        unlockedEpisodes: customer.unlockedEpisodes || [],
        createdAt: customer.createdAt
      }
    });

  } catch (error: any) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}