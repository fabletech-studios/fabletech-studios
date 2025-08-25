import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request);
    if (!authResult.isAdmin) {
      console.error('[Grant Credits V2] Admin auth failed:', authResult.error);
      return NextResponse.json({ 
        error: authResult.error || 'Admin access required' 
      }, { status: 403 });
    }
    
    console.log('[Grant Credits V2] Admin verified:', { 
      uid: authResult.uid, 
      email: authResult.email 
    });

    const { email, credits, reason } = await request.json();

    // Validate input
    if (!email || !credits || credits <= 0) {
      return NextResponse.json({ 
        error: 'Invalid input. Email and positive credit amount required.' 
      }, { status: 400 });
    }

    // Use Admin SDK directly
    const admin = await import('firebase-admin');
    
    // Initialize if not already done
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error('Admin credentials not found in environment');
        return NextResponse.json({ 
          error: 'Server configuration error - admin credentials missing' 
        }, { status: 500 });
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    
    const db = admin.firestore();
    
    // Find customer by email
    console.log('Looking for customer:', email.toLowerCase());
    const customersSnapshot = await db.collection('customers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (customersSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Customer not found with this email address.' 
      }, { status: 404 });
    }

    const customerDoc = customersSnapshot.docs[0];
    const customerId = customerDoc.id;
    const currentCredits = customerDoc.data().credits || 0;

    // Update credits atomically
    await db.collection('customers').doc(customerId).update({
      credits: admin.firestore.FieldValue.increment(credits),
      lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated balance
    const updatedDoc = await db.collection('customers').doc(customerId).get();
    const newCreditBalance = updatedDoc.data()?.credits || (currentCredits + credits);

    // Create transaction record
    await db.collection('credit-transactions').add({
      customerId,
      customerEmail: email.toLowerCase(),
      type: 'admin_grant',
      credits,
      previousBalance: currentCredits,
      newBalance: newCreditBalance,
      reason: reason || 'Credits granted by admin',
      grantedBy: adminUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true,
      message: `Successfully granted ${credits} credits to ${email}`,
      newBalance: newCreditBalance
    });

  } catch (error: any) {
    console.error('[Grant Credits V2] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to grant credits',
      details: error.toString()
    }, { status: 500 });
  }
}