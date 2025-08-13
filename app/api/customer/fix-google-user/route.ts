import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server-config';

export async function POST(request: NextRequest) {
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
    let userInfo: any;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      userInfo = {
        email: payload.email,
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture
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

    // Check if customer document exists
    const customerRef = doc(serverDb, 'customers', uid);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      console.log('Creating missing customer document for Google OAuth user:', uid);
      
      // Create customer document with all required fields
      const customerData = {
        uid: uid,
        email: userInfo.email || `${uid}@google.com`,
        name: userInfo.name,
        credits: 100, // Welcome bonus
        createdAt: new Date(),
        updatedAt: new Date(),
        authProvider: 'google',
        photoURL: userInfo.picture || '',
        emailVerified: true, // Google users have verified emails
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
        message: 'Customer document created',
        customer: customerData
      });
    } else {
      // Document exists, check for missing fields
      const data = customerDoc.data();
      const updates: any = {};
      
      // Only add unlockedEpisodes if it's undefined, not if it's an empty array
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
      
      if (data.emailVerified === undefined) {
        updates.emailVerified = true; // Google users have verified emails
      }
      
      if (Object.keys(updates).length > 0) {
        console.log('Updating customer document with missing fields:', updates);
        await setDoc(customerRef, updates, { merge: true });
        
        return NextResponse.json({
          success: true,
          message: 'Customer document updated',
          updates
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Customer document already complete',
        customer: data
      });
    }
  } catch (error: any) {
    console.error('Fix Google user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check customer status
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
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      uid = payload.user_id || payload.sub || payload.uid;
      
      if (!uid) {
        throw new Error('Invalid token - no uid');
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid token: ' + error.message },
        { status: 401 }
      );
    }

    // Check if customer document exists
    const customerRef = doc(serverDb, 'customers', uid);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      return NextResponse.json({
        success: false,
        exists: false,
        uid,
        message: 'Customer document does not exist'
      });
    }
    
    const data = customerDoc.data();
    const missingFields = [];
    
    if (!data.unlockedEpisodes) missingFields.push('unlockedEpisodes');
    if (!data.stats) missingFields.push('stats');
    if (!data.subscription) missingFields.push('subscription');
    if (data.emailVerified === undefined) missingFields.push('emailVerified');
    
    return NextResponse.json({
      success: true,
      exists: true,
      uid,
      hasAllFields: missingFields.length === 0,
      missingFields,
      customer: data
    });
  } catch (error: any) {
    console.error('Check Google user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}