import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request);
    if (!authResult.isAdmin) {
      console.error('[Grant Credits] Admin auth failed:', authResult.error);
      return NextResponse.json({ 
        error: authResult.error || 'Admin access required' 
      }, { status: 403 });
    }
    
    console.log('[Grant Credits] Admin verified:', { 
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

    // Check if database is initialized
    if (!serverDb) {
      console.error('[Grant Credits] Database not initialized');
      return NextResponse.json({ 
        error: 'Database not initialized. Please check Firebase configuration.' 
      }, { status: 500 });
    }

    console.log('[Grant Credits] Looking for customer:', email.toLowerCase());

    // Try Admin SDK first, then fall back to client SDK
    let querySnapshot: any = null;
    
    try {
      // Try Admin SDK (bypasses security rules)
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        console.log('[Grant Credits] Using Admin SDK');
        const snapshot = await adminDb.collection('customers')
          .where('email', '==', email.toLowerCase())
          .get();
        querySnapshot = snapshot;
      }
    } catch (adminError) {
      console.log('[Grant Credits] Admin SDK not available, trying client SDK');
    }
    
    // If Admin SDK failed, try client SDK
    if (!querySnapshot) {
      const customersRef = collection(serverDb, 'customers');
      const q = query(customersRef, where('email', '==', email.toLowerCase()));
      querySnapshot = await getDocs(q);
    }

    // Check if we have results (handles both Admin SDK and Client SDK)
    const hasResults = querySnapshot.empty === false || (querySnapshot.docs && querySnapshot.docs.length > 0);
    if (!hasResults) {
      return NextResponse.json({ 
        error: 'Customer not found with this email address.' 
      }, { status: 404 });
    }

    const customerDoc = querySnapshot.docs[0];
    const customerId = customerDoc.id;
    const customerData = typeof customerDoc.data === 'function' ? customerDoc.data() : customerDoc.data;
    const currentCredits = customerData.credits || 0;

    // Update customer credits atomically
    let newCreditBalance = currentCredits + credits;
    
    try {
      // Try Admin SDK first
      const { adminDb } = await import('@/lib/firebase/admin');
      if (adminDb) {
        const FieldValue = await import('firebase-admin/firestore').then(m => m.FieldValue);
        await adminDb.collection('customers').doc(customerId).update({
          credits: FieldValue.increment(credits),
          lastCreditUpdate: FieldValue.serverTimestamp()
        });
        
        // Get updated balance
        const updatedDoc = await adminDb.collection('customers').doc(customerId).get();
        newCreditBalance = updatedDoc.data()?.credits || newCreditBalance;
      } else {
        throw new Error('Admin SDK not available');
      }
    } catch (adminError) {
      // Fall back to client SDK
      await updateDoc(doc(serverDb, 'customers', customerId), {
        credits: increment(credits),
        lastCreditUpdate: serverTimestamp()
      });
      
      // Get the new balance after increment
      const updatedDoc = await getDoc(doc(serverDb, 'customers', customerId));
      newCreditBalance = updatedDoc.data()?.credits || newCreditBalance;
    }

    // Create transaction record
    await addDoc(collection(serverDb, 'credit-transactions'), {
      customerId,
      customerEmail: email.toLowerCase(),
      type: 'admin_grant',
      credits,
      previousBalance: currentCredits,
      newBalance: newCreditBalance,
      reason: reason || 'Credits granted by admin',
      grantedBy: authResult.uid || 'admin',
      grantedByEmail: authResult.email,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true,
      message: `Successfully granted ${credits} credits to ${email}`,
      newBalance: newCreditBalance
    });

  } catch (error: any) {
    console.error('[Grant Credits] Full error:', error);
    console.error('[Grant Credits] Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Failed to grant credits' 
    }, { status: 500 });
  }
}