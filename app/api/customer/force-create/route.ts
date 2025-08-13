import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server-config';

/**
 * Force creates a customer document if it doesn't exist.
 * This endpoint ensures the customer document exists with all required fields.
 */
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
    
    // Extract UID and user info from token
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
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture || ''
      };
      
      if (!uid) {
        throw new Error('Invalid token - no uid');
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid token: ' + error.message },
        { status: 401 }
      );
    }

    if (!serverDb) {
      console.error('Firebase database not initialized');
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Check if customer exists
    const customerRef = doc(serverDb, 'customers', uid);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      console.log('Creating customer document for uid:', uid);
      
      // Create full customer document
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
      
      await setDoc(customerRef, customerData);
      
      return NextResponse.json({
        success: true,
        created: true,
        message: 'Customer document created successfully',
        customer: customerData
      });
    } else {
      // Customer exists, ensure all fields are present
      const data = customerDoc.data();
      const updates: any = {};
      
      if (data.unlockedEpisodes === undefined) {
        updates.unlockedEpisodes = [];
      }
      
      if (!data.stats) {
        updates.stats = {
          episodesUnlocked: 0,
          creditsSpent: 0,
          totalCreditsPurchased: 0,
          seriesCompleted: 0
        };
      }
      
      if (!data.subscription) {
        updates.subscription = {
          status: 'active',
          tier: 'free'
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await setDoc(customerRef, updates, { merge: true });
        return NextResponse.json({
          success: true,
          updated: true,
          message: 'Customer document updated with missing fields',
          updates
        });
      }
      
      return NextResponse.json({
        success: true,
        exists: true,
        message: 'Customer document already exists with all fields',
        customer: data
      });
    }
  } catch (error: any) {
    console.error('Force create customer error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}