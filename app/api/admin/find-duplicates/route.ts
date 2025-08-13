import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      const snapshot = await getDocs(collection(serverDb, 'customers'));
      const emailMap: Record<string, any[]> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const email = data.email;
        if (email) {
          if (!emailMap[email]) {
            emailMap[email] = [];
          }
          emailMap[email].push({
            uid: doc.id,
            credits: data.credits,
            unlocked: data.unlockedEpisodes?.length || 0,
            createdAt: data.createdAt
          });
        }
      });
      
      // Find duplicates
      const duplicates = Object.entries(emailMap)
        .filter(([email, records]) => records.length > 1)
        .map(([email, records]) => ({
          email,
          records,
          count: records.length
        }));
      
      return NextResponse.json({
        duplicates,
        totalDuplicateRecords: duplicates.reduce((sum, dup) => sum + dup.count - 1, 0),
        totalCustomers: snapshot.size
      });
    }
    
    // Use Admin SDK
    const snapshot = await adminDb.collection('customers').get();
    const emailMap: Record<string, any[]> = {};
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const email = data.email;
      if (email) {
        if (!emailMap[email]) {
          emailMap[email] = [];
        }
        emailMap[email].push({
          uid: doc.id,
          credits: data.credits,
          unlocked: data.unlockedEpisodes?.length || 0,
          createdAt: data.createdAt
        });
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(emailMap)
      .filter(([email, records]) => records.length > 1)
      .map(([email, records]) => ({
        email,
        records,
        count: records.length
      }));
    
    return NextResponse.json({
      duplicates,
      totalDuplicateRecords: duplicates.reduce((sum, dup) => sum + dup.count - 1, 0),
      totalCustomers: snapshot.size
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}