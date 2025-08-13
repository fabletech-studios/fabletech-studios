import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    // Safety check - only allow deletion of test accounts
    if (!email.includes('+test') && !email.includes('test')) {
      return NextResponse.json({ 
        error: 'For safety, this endpoint only deletes accounts with "test" in the email' 
      }, { status: 400 });
    }
    
    console.log(`🗑️ Deleting test customer: ${email}`);
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs, doc, deleteDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Find all customers with this email
      const snapshot = await getDocs(collection(serverDb, 'customers'));
      const toDelete: string[] = [];
      
      snapshot.forEach(d => {
        const data = d.data();
        if (data.email === email) {
          toDelete.push(d.id);
        }
      });
      
      if (toDelete.length === 0) {
        return NextResponse.json({ 
          message: 'No customer found with that email',
          email 
        });
      }
      
      // Delete all matching customers
      for (const uid of toDelete) {
        await deleteDoc(doc(serverDb, 'customers', uid));
        console.log(`Deleted customer: ${uid}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${toDelete.length} customer record(s)`,
        deletedUIDs: toDelete
      });
    }
    
    // Use Admin SDK
    const snapshot = await adminDb.collection('customers')
      .where('email', '==', email)
      .get();
    
    const toDelete: string[] = [];
    snapshot.forEach((d: any) => {
      toDelete.push(d.id);
    });
    
    if (toDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No customer found with that email',
        email 
      });
    }
    
    // Delete all matching customers
    for (const uid of toDelete) {
      await adminDb.collection('customers').doc(uid).delete();
      console.log(`Deleted customer: ${uid}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${toDelete.length} customer record(s)`,
      deletedUIDs: toDelete
    });
    
  } catch (error: any) {
    console.error('Delete test customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}