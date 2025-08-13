import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, correctUid } = await request.json();
    
    if (!email || !correctUid) {
      return NextResponse.json({ error: 'Email and correctUid required' });
    }
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs, query, where, doc, updateDoc, deleteDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Find all customers with this email
      const q = query(collection(serverDb, 'customers'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      const customers: any[] = [];
      snapshot.forEach(d => {
        customers.push({
          uid: d.id,
          ...d.data()
        });
      });
      
      // If multiple customers found, merge into the correct one
      if (customers.length > 1) {
        const correct = customers.find(c => c.uid === correctUid);
        const others = customers.filter(c => c.uid !== correctUid);
        
        if (correct && others.length > 0) {
          // Merge unlocked episodes
          let allUnlocked = correct.unlockedEpisodes || [];
          others.forEach(other => {
            const otherUnlocked = other.unlockedEpisodes || [];
            otherUnlocked.forEach(ep => {
              if (!allUnlocked.find((e: any) => e.seriesId === ep.seriesId && e.episodeNumber === ep.episodeNumber)) {
                allUnlocked.push(ep);
              }
            });
          });
          
          // Take the highest credit count
          const maxCredits = Math.max(correct.credits, ...others.map(o => o.credits));
          
          // Update the correct document
          await updateDoc(doc(serverDb, 'customers', correctUid), {
            credits: maxCredits,
            unlockedEpisodes: allUnlocked,
            updatedAt: new Date()
          });
          
          // Delete duplicates
          for (const other of others) {
            await deleteDoc(doc(serverDb, 'customers', other.uid));
          }
          
          return NextResponse.json({
            message: 'Fixed customer data',
            merged: others.length,
            finalCredits: maxCredits,
            finalUnlocked: allUnlocked.length
          });
        }
      }
      
      return NextResponse.json({
        message: 'No duplicates found',
        customers: customers.length
      });
    }
    
    // Use Admin SDK
    const snapshot = await adminDb.collection('customers')
      .where('email', '==', email)
      .get();
    
    const customers: any[] = [];
    snapshot.forEach((d: any) => {
      customers.push({
        uid: d.id,
        ...d.data()
      });
    });
    
    // If multiple customers found, merge into the correct one
    if (customers.length > 1) {
      const correct = customers.find(c => c.uid === correctUid);
      const others = customers.filter(c => c.uid !== correctUid);
      
      if (correct && others.length > 0) {
        // Merge unlocked episodes
        let allUnlocked = correct.unlockedEpisodes || [];
        others.forEach(other => {
          const otherUnlocked = other.unlockedEpisodes || [];
          otherUnlocked.forEach(ep => {
            if (!allUnlocked.find((e: any) => e.seriesId === ep.seriesId && e.episodeNumber === ep.episodeNumber)) {
              allUnlocked.push(ep);
            }
          });
        });
        
        // Take the highest credit count
        const maxCredits = Math.max(correct.credits, ...others.map(o => o.credits));
        
        // Update the correct document
        await adminDb.collection('customers').doc(correctUid).update({
          credits: maxCredits,
          unlockedEpisodes: allUnlocked,
          updatedAt: new Date()
        });
        
        // Delete duplicates
        for (const other of others) {
          await adminDb.collection('customers').doc(other.uid).delete();
        }
        
        return NextResponse.json({
          message: 'Fixed customer data',
          merged: others.length,
          finalCredits: maxCredits,
          finalUnlocked: allUnlocked.length
        });
      }
    }
    
    return NextResponse.json({
      message: 'No duplicates found',
      customers: customers.length
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}