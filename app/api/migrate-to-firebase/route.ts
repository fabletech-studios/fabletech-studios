import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import fs from 'fs/promises';
import path from 'path';

// This endpoint migrates local data to Firebase
export async function POST(request: NextRequest) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_MIGRATION_KEY || 'admin-migration-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const migrationResults = {
      customers: { success: 0, failed: 0, errors: [] as any[] },
      content: { success: 0, failed: 0, errors: [] as any[] }
    };

    // 1. Migrate customers
    console.log('Starting customer migration...');
    const customersPath = path.join(process.cwd(), 'data', 'customers.json');
    try {
      const customersData = await fs.readFile(customersPath, 'utf-8');
      const customers = JSON.parse(customersData);

      for (const customer of customers) {
        try {
          // Create Firebase Auth user with temporary password
          const tempPassword = `TempPass${Date.now()}!`;
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            customer.email, 
            tempPassword
          );

          const uid = userCredential.user.uid;

          // Create Firestore customer document
          await setDoc(doc(db, 'customers', uid), {
            uid,
            email: customer.email,
            name: customer.name,
            credits: customer.credits,
            createdAt: serverTimestamp(),
            emailVerified: false,
            legacyId: customer.id,
            unlockedEpisodes: customer.unlockedEpisodes?.map((ep: any) => ({
              ...ep,
              unlockedAt: serverTimestamp()
            })) || [],
            stats: customer.stats || {
              episodesUnlocked: 0,
              creditsSpent: 0
            }
          });

          // Create initial credit transaction
          await setDoc(doc(collection(db, 'credit-transactions')), {
            customerId: uid,
            type: 'bonus',
            amount: 100,
            balance: 100,
            description: 'Welcome bonus (migrated)',
            createdAt: serverTimestamp()
          });

          // If customer spent credits, record it
          if (customer.credits < 100) {
            const spent = 100 - customer.credits;
            await setDoc(doc(collection(db, 'credit-transactions')), {
              customerId: uid,
              type: 'spend',
              amount: -spent,
              balance: customer.credits,
              description: 'Episode unlocks (migrated)',
              createdAt: serverTimestamp()
            });
          }

          migrationResults.customers.success++;
        } catch (error: any) {
          migrationResults.customers.failed++;
          migrationResults.customers.errors.push({
            email: customer.email,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error reading customers file:', error);
    }

    // 2. Migrate content
    console.log('Starting content migration...');
    const contentPath = path.join(process.cwd(), 'data', 'content.json');
    try {
      const contentData = await fs.readFile(contentPath, 'utf-8');
      const content = JSON.parse(contentData);

      for (const series of content.series || []) {
        try {
          await setDoc(doc(db, 'series', series.id), {
            ...series,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            episodes: series.episodes.map((ep: any) => ({
              ...ep,
              createdAt: serverTimestamp()
            }))
          });

          migrationResults.content.success++;
        } catch (error: any) {
          migrationResults.content.failed++;
          migrationResults.content.errors.push({
            series: series.title,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error reading content file:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: migrationResults,
      note: 'Customers have been created with temporary passwords. They will need to reset their passwords via email.'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}