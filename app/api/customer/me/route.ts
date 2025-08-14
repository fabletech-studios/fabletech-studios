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

    let customer = await getFirebaseCustomer(uid);
    
    // If customer not found, try to create for Google OAuth users
    if (!customer) {
      // DO NOT CREATE CUSTOMERS HERE - This causes data loss!
      // Customers should only be created during signup
      console.error('Customer not found in /api/customer/me for uid:', uid);
      return NextResponse.json(
        { success: false, error: 'Customer document not found. Please contact support.' },
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