import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, credits, unlockedEpisodes } = body;
    
    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }
    
    console.log('EMERGENCY RESTORE for customer:', uid);
    console.log('Email:', email);
    console.log('Restoring credits:', credits);
    console.log('Restoring episodes:', unlockedEpisodes ? unlockedEpisodes.length : 0);
    
    const adminModule = await import('@/lib/firebase/admin');
    const adminDb = adminModule.adminDb;
    
    if (!adminDb) {
      // Fallback to client SDK
      const firestoreModule = await import('firebase/firestore');
      const { doc, setDoc, getDoc } = firestoreModule;
      const serverModule = await import('@/lib/firebase/server-config');
      const serverDb = serverModule.serverDb;
      
      if (!serverDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
      // Check if customer exists
      const customerRef = doc(serverDb, 'customers', uid);
      const customerDoc = await getDoc(customerRef);
      
      let currentData = {};
      let isNew = false;
      
      if (!customerDoc.exists()) {
        console.log('Customer document not found - CREATING NEW');
        isNew = true;
        // Create new customer document
        currentData = {
          uid,
          email: email || '',
          credits: 100, // Will be overwritten
          unlockedEpisodes: [],
          createdAt: new Date(),
          restoredAt: new Date(),
          restoredReason: 'Document was missing - recreated'
        };
      } else {
        currentData = customerDoc.data();
      }
      
      // Prepare update/create data
      const customerData = {
        ...currentData,
        uid,
        email: email || (currentData as any).email || '',
        updatedAt: new Date(),
        restoredAt: new Date(),
        restoredReason: 'Emergency restore due to data loss'
      } as any;
      
      if (credits !== undefined) {
        customerData.previousCredits = (currentData as any).credits;
        customerData.credits = credits;
      }
      
      if (unlockedEpisodes && unlockedEpisodes.length > 0) {
        // For new document, just set the episodes
        if (isNew) {
          customerData.unlockedEpisodes = unlockedEpisodes;
        } else {
          // Merge with existing unlocked episodes
          const existingUnlocked = (currentData as any).unlockedEpisodes || [];
          const mergedEpisodes = [...existingUnlocked];
          
          unlockedEpisodes.forEach((newEp: any) => {
            const exists = mergedEpisodes.some((e: any) => 
              e.seriesId === newEp.seriesId && 
              e.episodeNumber === newEp.episodeNumber
            );
            if (!exists) {
              mergedEpisodes.push(newEp);
            }
          });
          
          customerData.unlockedEpisodes = mergedEpisodes;
        }
        customerData.previousUnlockedCount = (currentData as any).unlockedEpisodes ? (currentData as any).unlockedEpisodes.length : 0;
      }
      
      // Use setDoc to create or update
      await setDoc(customerRef, customerData);
      
      return NextResponse.json({
        success: true,
        message: isNew ? 'Customer document created and restored' : 'Customer data restored',
        uid,
        wasNew: isNew,
        restoredCredits: customerData.credits,
        totalUnlockedEpisodes: customerData.unlockedEpisodes ? customerData.unlockedEpisodes.length : 0
      });
    }
    
    // Use Admin SDK
    const customerRef = adminDb.collection('customers').doc(uid);
    const customerDoc = await customerRef.get();
    
    let currentData = {} as any;
    let isNew = false;
    
    if (!customerDoc.exists) {
      console.log('Customer document not found - CREATING NEW');
      isNew = true;
      currentData = {
        uid,
        email: email || '',
        credits: 100,
        unlockedEpisodes: [],
        createdAt: new Date(),
        restoredAt: new Date(),
        restoredReason: 'Document was missing - recreated'
      };
    } else {
      currentData = customerDoc.data();
    }
    
    const customerData = {
      ...currentData,
      uid,
      email: email || currentData.email || '',
      updatedAt: new Date(),
      restoredAt: new Date(),
      restoredReason: 'Emergency restore due to data loss'
    } as any;
    
    if (credits !== undefined) {
      customerData.previousCredits = currentData.credits;
      customerData.credits = credits;
    }
    
    if (unlockedEpisodes && unlockedEpisodes.length > 0) {
      if (isNew) {
        customerData.unlockedEpisodes = unlockedEpisodes;
      } else {
        const existingUnlocked = currentData.unlockedEpisodes || [];
        const mergedEpisodes = [...existingUnlocked];
        
        unlockedEpisodes.forEach((newEp: any) => {
          const exists = mergedEpisodes.some((e: any) => 
            e.seriesId === newEp.seriesId && 
            e.episodeNumber === newEp.episodeNumber
          );
          if (!exists) {
            mergedEpisodes.push(newEp);
          }
        });
        
        customerData.unlockedEpisodes = mergedEpisodes;
      }
      customerData.previousUnlockedCount = currentData.unlockedEpisodes ? currentData.unlockedEpisodes.length : 0;
    }
    
    await customerRef.set(customerData);
    
    return NextResponse.json({
      success: true,
      message: isNew ? 'Customer document created and restored' : 'Customer data restored',
      uid,
      wasNew: isNew,
      restoredCredits: customerData.credits,
      totalUnlockedEpisodes: customerData.unlockedEpisodes ? customerData.unlockedEpisodes.length : 0
    });
    
  } catch (error: any) {
    console.error('Restore customer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
