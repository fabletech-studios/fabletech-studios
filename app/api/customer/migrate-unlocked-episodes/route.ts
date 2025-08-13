import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server-config';

/**
 * This endpoint migrates and restores unlocked episodes data.
 * It looks at credit transactions to reconstruct which episodes were unlocked.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (you might want to add proper admin check)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Get all credit transactions that are for episode unlocks
    const transactionsRef = collection(serverDb, 'credit-transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    
    // Group transactions by customer
    const customerUnlocks: Map<string, Array<{
      seriesId: string;
      episodeNumber: number;
      unlockedAt: Date;
    }>> = new Map();
    
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Look for episode unlock transactions
      if (data.type === 'spend' && data.metadata?.seriesId && data.metadata?.episodeNumber) {
        const customerId = data.customerId;
        
        if (!customerUnlocks.has(customerId)) {
          customerUnlocks.set(customerId, []);
        }
        
        customerUnlocks.get(customerId)!.push({
          seriesId: data.metadata.seriesId,
          episodeNumber: data.metadata.episodeNumber,
          unlockedAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      }
    });
    
    // Update each customer's unlocked episodes
    let updatedCount = 0;
    const errors: string[] = [];
    
    for (const [customerId, unlocks] of customerUnlocks.entries()) {
      try {
        const customerRef = doc(serverDb, 'customers', customerId);
        
        // Get current customer data to merge with existing unlocks
        const { getDoc } = await import('firebase/firestore');
        const customerDoc = await getDoc(customerRef);
        
        if (customerDoc.exists()) {
          const currentData = customerDoc.data();
          const existingUnlocks = currentData.unlockedEpisodes || [];
          
          // Create a set of existing unlocks for deduplication
          const existingSet = new Set(
            existingUnlocks.map((u: any) => `${u.seriesId}-${u.episodeNumber}`)
          );
          
          // Add missing unlocks
          const newUnlocks = unlocks.filter(
            u => !existingSet.has(`${u.seriesId}-${u.episodeNumber}`)
          );
          
          if (newUnlocks.length > 0) {
            const mergedUnlocks = [...existingUnlocks, ...newUnlocks];
            
            await updateDoc(customerRef, {
              unlockedEpisodes: mergedUnlocks,
              'stats.episodesUnlocked': mergedUnlocks.length
            });
            
            updatedCount++;
            console.log(`Updated customer ${customerId}: added ${newUnlocks.length} episodes`);
          }
        }
      } catch (error) {
        console.error(`Error updating customer ${customerId}:`, error);
        errors.push(`Customer ${customerId}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${updatedCount} customers.`,
      totalCustomersProcessed: customerUnlocks.size,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check what would be migrated
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!serverDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Get all credit transactions that are for episode unlocks
    const transactionsRef = collection(serverDb, 'credit-transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    
    // Group transactions by customer
    const customerUnlocks: Map<string, number> = new Map();
    
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Look for episode unlock transactions
      if (data.type === 'spend' && data.metadata?.seriesId && data.metadata?.episodeNumber) {
        const customerId = data.customerId;
        customerUnlocks.set(customerId, (customerUnlocks.get(customerId) || 0) + 1);
      }
    });
    
    return NextResponse.json({
      success: true,
      customersWithUnlocks: Array.from(customerUnlocks.entries()).map(([id, count]) => ({
        customerId: id,
        unlockedEpisodeCount: count
      })),
      totalCustomers: customerUnlocks.size
    });
    
  } catch (error: any) {
    console.error('Check migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}