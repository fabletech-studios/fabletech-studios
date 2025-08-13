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
      console.log('Customer not found, attempting to create for uid:', uid);
      
      try {
        // Import Firebase admin
        const { adminDb } = await import('@/lib/firebase/admin');
        const { doc, setDoc } = await import('firebase/firestore');
        const { serverDb } = await import('@/lib/firebase/server-config');
        
        const customerData = {
          uid: uid,
          email: userInfo.email,
          name: userInfo.name,
          credits: 100, // Welcome bonus
          createdAt: new Date(),
          updatedAt: new Date(),
          authProvider: 'google',
          photoURL: userInfo.picture,
          emailVerified: true,
          unlockedEpisodes: [],
          stats: {
            episodesUnlocked: 0,
            creditsSpent: 0,
            totalCreditsPurchased: 0,
            seriesCompleted: 0
          },
          subscription: {
            status: 'active',
            tier: 'free'
          }
        };
        
        // Try admin SDK first
        if (adminDb) {
          console.log('Creating customer with admin SDK');
          await adminDb.collection('customers').doc(uid).set(customerData);
          customer = customerData as any;
        } else if (serverDb) {
          console.log('Creating customer with client SDK');
          await setDoc(doc(serverDb, 'customers', uid), customerData);
          customer = customerData as any;
        } else {
          throw new Error('No database connection available');
        }
      } catch (createError: any) {
        console.error('Failed to create customer:', createError);
        return NextResponse.json(
          { success: false, error: 'Customer not found and could not be created' },
          { status: 404 }
        );
      }
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