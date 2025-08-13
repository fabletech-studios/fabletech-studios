import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    console.log(`🔍 Checking customer records for: ${email}`);
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Find all customers with this email
      const q = query(collection(serverDb, 'customers'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      const customers: any[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        customers.push({
          uid: d.id,
          email: data.email,
          credits: data.credits,
          unlockedEpisodes: data.unlockedEpisodes || [],
          createdAt: data.createdAt
        });
      });
      
      // Check for inconsistencies
      const analysis = {
        email,
        totalRecords: customers.length,
        customers: customers.map(c => ({
          uid: c.uid,
          credits: c.credits,
          episodesUnlocked: c.unlockedEpisodes.length,
          hasEpisode2: c.unlockedEpisodes.some((e: any) => e.episodeNumber === 2)
        })),
        hasDuplicates: customers.length > 1,
        recommendation: customers.length > 1 ? 'MERGE REQUIRED' : 'No issues found'
      };
      
      return NextResponse.json(analysis);
    }
    
    // Use Admin SDK
    const snapshot = await adminDb.collection('customers')
      .where('email', '==', email)
      .get();
    
    const customers: any[] = [];
    snapshot.forEach((d: any) => {
      const data = d.data();
      customers.push({
        uid: d.id,
        email: data.email,
        credits: data.credits,
        unlockedEpisodes: data.unlockedEpisodes || [],
        createdAt: data.createdAt
      });
    });
    
    // Check for inconsistencies
    const analysis = {
      email,
      totalRecords: customers.length,
      customers: customers.map(c => ({
        uid: c.uid,
        credits: c.credits,
        episodesUnlocked: c.unlockedEpisodes.length,
        hasEpisode2: c.unlockedEpisodes.some((e: any) => e.episodeNumber === 2)
      })),
      hasDuplicates: customers.length > 1,
      recommendation: customers.length > 1 ? 'MERGE REQUIRED' : 'No issues found'
    };
    
    return NextResponse.json(analysis);
    
  } catch (error: any) {
    console.error('Check customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}