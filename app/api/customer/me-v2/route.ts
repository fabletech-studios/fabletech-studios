import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

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
    
    // Extract UID from token
    let uid: string;
    let userInfo: any = {};
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      userInfo = {
        email: payload.email || `${uid}@google.com`,
        name: payload.name || payload.given_name || 'User',
        picture: payload.picture || ''
      };
      
      if (!uid) {
        throw new Error('No UID in token');
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Use Admin SDK if available
    if (adminDb) {
      try {
        const customerDoc = await adminDb.collection('customers').doc(uid).get();
        
        if (!customerDoc.exists) {
          // Customer doesn't exist - this is expected for brand new users
          // The client-side code should create the customer
          return NextResponse.json(
            { success: false, error: 'Customer not found', uid },
            { status: 404 }
          );
        }
        
        const customerData = customerDoc.data();
        
        return NextResponse.json({
          success: true,
          customer: {
            uid: uid,
            email: customerData.email || userInfo.email,
            name: customerData.name || userInfo.name,
            credits: customerData.credits || 0,
            stats: customerData.stats || { episodesUnlocked: 0, creditsSpent: 0 },
            unlockedEpisodes: customerData.unlockedEpisodes || [],
            createdAt: customerData.createdAt
          }
        });
      } catch (error) {
        console.error('Admin SDK error:', error);
      }
    }
    
    // Fallback to client SDK
    const { getFirebaseCustomer } = await import('@/lib/firebase/customer-service');
    const customer = await getFirebaseCustomer(uid);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found', uid },
        { status: 404 }
      );
    }

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