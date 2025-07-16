import { createCustomer } from './auth-service';
import { createSeries, createEpisode } from './content-service';
import { uploadFile } from './storage-service';
import { getAllSeries as getLocalSeries } from '../content-manager';
import fs from 'fs/promises';
import path from 'path';

// Migration status tracking
export interface MigrationStatus {
  totalItems: number;
  completed: number;
  failed: number;
  errors: string[];
}

// Migrate customers from local JSON to Firebase Auth
export async function migrateCustomers(
  customersFilePath: string = path.join(process.cwd(), 'data/customers.json')
): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    totalItems: 0,
    completed: 0,
    failed: 0,
    errors: []
  };

  try {
    const customersData = await fs.readFile(customersFilePath, 'utf-8');
    const customers = JSON.parse(customersData);
    status.totalItems = customers.length;

    for (const customer of customers) {
      try {
        // Note: We can't migrate passwords, so users will need to reset
        // In production, you'd send password reset emails
        const tempPassword = `TempPass${Date.now()}!`;
        
        const result = await createCustomer(
          customer.email,
          tempPassword,
          customer.name
        );

        if (result.success) {
          status.completed++;
          console.log(`Migrated customer: ${customer.email}`);
        } else {
          status.failed++;
          status.errors.push(`Failed to migrate ${customer.email}: ${result.error}`);
        }
      } catch (error: any) {
        status.failed++;
        status.errors.push(`Error migrating ${customer.email}: ${error.message}`);
      }
    }
  } catch (error: any) {
    status.errors.push(`Failed to read customers file: ${error.message}`);
  }

  return status;
}

// Migrate series and episodes from local to Firebase
export async function migrateContent(adminUserId: string): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    totalItems: 0,
    completed: 0,
    failed: 0,
    errors: []
  };

  try {
    const localSeries = await getLocalSeries();
    status.totalItems = localSeries.length;

    for (const series of localSeries) {
      try {
        // Create series in Firebase
        const seriesResult = await createSeries({
          title: series.title,
          description: series.description,
          author: series.author || '',
          genre: series.genre || '',
          episodeCount: series.episodes.length,
          createdBy: adminUserId
        });

        if (!seriesResult.success) {
          throw new Error(seriesResult.error);
        }

        const firebaseSeriesId = seriesResult.seriesId!;

        // Migrate episodes
        for (const episode of series.episodes) {
          try {
            // Create episode in Firebase
            const episodeResult = await createEpisode({
              seriesId: firebaseSeriesId,
              episodeNumber: episode.episodeNumber,
              title: episode.title,
              description: episode.description || '',
              duration: episode.duration || '',
              credits: episode.credits || 0,
              isFree: episode.isFree || false
            });

            if (episodeResult.success) {
              console.log(`Migrated episode: ${episode.title}`);
            } else {
              status.errors.push(`Failed to migrate episode ${episode.title}: ${episodeResult.error}`);
            }
          } catch (error: any) {
            status.errors.push(`Error migrating episode ${episode.title}: ${error.message}`);
          }
        }

        status.completed++;
        console.log(`Migrated series: ${series.title}`);
      } catch (error: any) {
        status.failed++;
        status.errors.push(`Error migrating series ${series.title}: ${error.message}`);
      }
    }
  } catch (error: any) {
    status.errors.push(`Failed to read local series: ${error.message}`);
  }

  return status;
}

// Backup Firebase data to local JSON
export async function backupFirebaseData(
  backupDir: string = path.join(process.cwd(), 'backups')
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    // Create backup directory
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `firebase-backup-${timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });

    // TODO: Implement backup logic
    // This would fetch all data from Firebase and save to JSON files

    return { success: true, path: backupPath };
  } catch (error: any) {
    console.error('Backup error:', error);
    return { success: false, error: error.message };
  }
}

// Verify migration by comparing counts
export async function verifyMigration(): Promise<{
  localCustomers: number;
  firebaseCustomers: number;
  localSeries: number;
  firebaseSeries: number;
  match: boolean;
}> {
  // TODO: Implement verification logic
  // This would compare counts between local and Firebase

  return {
    localCustomers: 0,
    firebaseCustomers: 0,
    localSeries: 0,
    firebaseSeries: 0,
    match: false
  };
}