import { NextRequest, NextResponse } from 'next/server';
import { extractUidFromToken } from '@/lib/utils/token-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Extract UID from token
    let uid: string;
    let userInfo: any;
    try {
      const extracted = extractUidFromToken(token);
      uid = extracted.uid;
      userInfo = extracted.userInfo;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`🔧 Ensuring customer document for UID: ${uid}`);
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK with server config
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      const customerRef = doc(serverDb, 'customers', uid);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        console.log('Creating customer document via client SDK');
        const customerData = {
          uid,
          email: userInfo?.email || '',
          name: userInfo?.name || 'User',
          credits: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          authProvider: 'google',
          photoURL: userInfo?.picture || '',
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
          customer: customerData
        });
      }
      
      return NextResponse.json({
        success: true,
        created: false,
        customer: customerDoc.data()
      });
    }
    
    // Use Admin SDK
    const customerRef = adminDb.collection('customers').doc(uid);
    const customerDoc = await customerRef.get();
    
    if (!customerDoc.exists) {
      console.log('Creating customer document via Admin SDK');
      const customerData = {
        uid,
        email: userInfo?.email || '',
        name: userInfo?.name || 'User',
        credits: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        authProvider: 'google',
        photoURL: userInfo?.picture || '',
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
      
      await customerRef.set(customerData);
      
      return NextResponse.json({
        success: true,
        created: true,
        customer: customerData
      });
    }
    
    return NextResponse.json({
      success: true,
      created: false,
      customer: customerDoc.data()
    });
    
  } catch (error: any) {
    console.error('Ensure customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}