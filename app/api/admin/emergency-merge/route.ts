import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    console.log(`🔍 Finding duplicate customers for: ${email}`);
    
    const { adminDb } = await import('@/lib/firebase/admin');
    
    if (!adminDb) {
      // Fallback to client SDK
      const { collection, getDocs, doc, updateDoc, deleteDoc } = await import('firebase/firestore');
      const { serverDb } = await import('@/lib/firebase/server-config');
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Find all customers with this email
      const snapshot = await getDocs(collection(serverDb, 'customers'));
      const duplicates: any[] = [];
      
      snapshot.forEach(d => {
        const data = d.data();
        if (data.email === email) {
          duplicates.push({
            uid: d.id,
            data: data
          });
        }
      });
      
      if (duplicates.length <= 1) {
        return NextResponse.json({ 
          message: 'No duplicates found',
          count: duplicates.length 
        });
      }
      
      // Find the primary customer (most data)
      const primary = duplicates.reduce((best, current) => {
        const bestScore = (best.data.credits || 0) + ((best.data.unlockedEpisodes?.length || 0) * 50);
        const currentScore = (current.data.credits || 0) + ((current.data.unlockedEpisodes?.length || 0) * 50);
        return currentScore > bestScore ? current : best;
      });
      
      // Merge all data
      let allUnlocked = primary.data.unlockedEpisodes || [];
      let maxCredits = primary.data.credits || 100;
      const mergedFrom: string[] = [];
      
      for (const dup of duplicates) {
        if (dup.uid !== primary.uid) {
          mergedFrom.push(dup.uid);
          
          // Merge unlocked episodes
          const otherUnlocked = dup.data.unlockedEpisodes || [];
          otherUnlocked.forEach((episode: any) => {
            if (!allUnlocked.find((e: any) => e.seriesId === episode.seriesId && e.episodeNumber === episode.episodeNumber)) {
              allUnlocked.push(episode);
            }
          });
          
          // Take highest credit count
          if (dup.data.credits > maxCredits) {
            maxCredits = dup.data.credits;
          }
        }
      }
      
      // Update primary customer
      await updateDoc(doc(serverDb, 'customers', primary.uid), {
        credits: maxCredits,
        unlockedEpisodes: allUnlocked,
        updatedAt: new Date(),
        mergedFrom: mergedFrom,
        mergedAt: new Date()
      });
      
      // Delete duplicates
      for (const dup of duplicates) {
        if (dup.uid !== primary.uid) {
          await deleteDoc(doc(serverDb, 'customers', dup.uid));
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Merged ${duplicates.length - 1} duplicates into ${primary.uid}`,
        primary: primary.uid,
        mergedFrom: mergedFrom,
        finalCredits: maxCredits,
        finalUnlocked: allUnlocked.length
      });
    }
    
    // Use Admin SDK
    const snapshot = await adminDb.collection('customers').get();
    const duplicates: any[] = [];
    
    snapshot.forEach((d: any) => {
      const data = d.data();
      if (data.email === email) {
        duplicates.push({
          uid: d.id,
          data: data
        });
      }
    });
    
    if (duplicates.length <= 1) {
      return NextResponse.json({ 
        message: 'No duplicates found',
        count: duplicates.length 
      });
    }
    
    // Find the primary customer (most data)
    const primary = duplicates.reduce((best, current) => {
      const bestScore = (best.data.credits || 0) + ((best.data.unlockedEpisodes?.length || 0) * 50);
      const currentScore = (current.data.credits || 0) + ((current.data.unlockedEpisodes?.length || 0) * 50);
      return currentScore > bestScore ? current : best;
    });
    
    // Merge all data
    let allUnlocked = primary.data.unlockedEpisodes || [];
    let maxCredits = primary.data.credits || 100;
    const mergedFrom: string[] = [];
    
    for (const dup of duplicates) {
      if (dup.uid !== primary.uid) {
        mergedFrom.push(dup.uid);
        
        // Merge unlocked episodes
        const otherUnlocked = dup.data.unlockedEpisodes || [];
        otherUnlocked.forEach((episode: any) => {
          if (!allUnlocked.find((e: any) => e.seriesId === episode.seriesId && e.episodeNumber === episode.episodeNumber)) {
            allUnlocked.push(episode);
          }
        });
        
        // Take highest credit count
        if (dup.data.credits > maxCredits) {
          maxCredits = dup.data.credits;
        }
      }
    }
    
    // Update primary customer using Admin SDK
    await adminDb.collection('customers').doc(primary.uid).update({
      credits: maxCredits,
      unlockedEpisodes: allUnlocked,
      updatedAt: new Date(),
      mergedFrom: mergedFrom,
      mergedAt: new Date()
    });
    
    // Delete duplicates
    for (const dup of duplicates) {
      if (dup.uid !== primary.uid) {
        await adminDb.collection('customers').doc(dup.uid).delete();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Merged ${duplicates.length - 1} duplicates into ${primary.uid}`,
      primary: primary.uid,
      mergedFrom: mergedFrom,
      finalCredits: maxCredits,
      finalUnlocked: allUnlocked.length
    });
    
  } catch (error: any) {
    console.error('Emergency merge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}