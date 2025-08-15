import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { serverDb } from './server-config';

// Helper to get the appropriate database instance
const getDb = () => {
  if (typeof window === 'undefined') {
    // Server-side
    return serverDb;
  } else {
    // Client-side
    return db;
  }
};

export interface FirebaseSeries {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  episodes: FirebaseEpisode[];
  createdAt: any;
  updatedAt?: any;
}

export interface FirebaseEpisode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  title_it?: string;  // Italian title
  description?: string;
  description_it?: string;  // Italian description
  language?: string;  // 'en' or 'it'
  isTranslation?: boolean;  // true if this is a translation
  originalEpisodeNumber?: number;  // if translation, which episode
  videoPath?: string;
  videoPath_it?: string;  // Italian video
  audioPath?: string;
  audioPath_it?: string;  // Italian audio
  thumbnailPath?: string;
  thumbnailPath_it?: string;  // Italian thumbnail
  duration?: string;
  credits?: number;
  isFree?: boolean;
}

// Get all series
export async function getAllSeriesFirebase(): Promise<FirebaseSeries[]> {
  try {
    const database = getDb();
    
    if (!database) {
      console.warn('Firestore not initialized');
      return [];
    }
    
    const seriesSnapshot = await getDocs(collection(database, 'series'));
    return seriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseSeries));
  } catch (error) {
    console.error('Get series error:', error);
    return [];
  }
}

// Get series by ID
export async function getSeriesFirebase(seriesId: string): Promise<FirebaseSeries | null> {
  try {
    const database = getDb();
    
    if (!database) {
      console.warn('Firestore not initialized');
      return null;
    }
    const seriesDoc = await getDoc(doc(database, 'series', seriesId));
    if (!seriesDoc.exists()) {
      return null;
    }
    return {
      id: seriesDoc.id,
      ...seriesDoc.data()
    } as FirebaseSeries;
  } catch (error) {
    console.error('Get series error:', error);
    return null;
  }
}

// Create new series
export async function createSeriesFirebase(series: Omit<FirebaseSeries, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const database = getDb();
    if (!database) return null;
    
    const seriesId = `series-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(database, 'series', seriesId), {
      ...series,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return seriesId;
  } catch (error) {
    console.error('Create series error:', error);
    return null;
  }
}

// Update series
export async function updateSeriesFirebase(
  seriesId: string, 
  updates: Partial<FirebaseSeries>
): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    await updateDoc(doc(database, 'series', seriesId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Update series error:', error);
    return false;
  }
}

// Delete series
export async function deleteSeriesFirebase(seriesId: string): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    
    await deleteDoc(doc(database, 'series', seriesId));
    return true;
  } catch (error) {
    console.error('Delete series error:', error);
    return false;
  }
}

// Add episode to series
export async function addEpisodeFirebase(
  seriesId: string, 
  episode: Omit<FirebaseEpisode, 'episodeId'>
): Promise<boolean> {
  try {
    console.log('[addEpisodeFirebase] Starting for series:', seriesId);
    console.log('[addEpisodeFirebase] Episode data:', episode);
    
    const series = await getSeriesFirebase(seriesId);
    if (!series) {
      console.error('[addEpisodeFirebase] Series not found:', seriesId);
      return false;
    }
    console.log('[addEpisodeFirebase] Series found:', series.title);
    console.log('[addEpisodeFirebase] Current episodes count:', series.episodes?.length || 0);

    const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEpisode: FirebaseEpisode = {
      ...episode,
      episodeId
    };
    console.log('[addEpisodeFirebase] New episode with ID:', episodeId);

    const updatedEpisodes = [...(series.episodes || []), newEpisode];
    console.log('[addEpisodeFirebase] Updated episodes count:', updatedEpisodes.length);
    
    const database = getDb();
    if (!database) {
      console.error('[addEpisodeFirebase] Database not initialized');
      return false;
    }
    console.log('[addEpisodeFirebase] Database initialized, updating document...');
    
    await updateDoc(doc(database, 'series', seriesId), {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
    });
    console.log('[addEpisodeFirebase] Document updated successfully');

    return true;
  } catch (error) {
    console.error('[addEpisodeFirebase] Error adding episode:', error);
    if (error instanceof Error) {
      console.error('[addEpisodeFirebase] Error message:', error.message);
      console.error('[addEpisodeFirebase] Error stack:', error.stack);
    }
    return false;
  }
}

// Update episode
export async function updateEpisodeFirebase(
  seriesId: string,
  episodeId: string,
  updates: Partial<FirebaseEpisode>
): Promise<boolean> {
  try {
    console.log('[updateEpisodeFirebase] Starting update');
    console.log('[updateEpisodeFirebase] Series ID:', seriesId);
    console.log('[updateEpisodeFirebase] Episode ID:', episodeId);
    
    const series = await getSeriesFirebase(seriesId);
    if (!series) {
      console.error('[updateEpisodeFirebase] Series not found:', seriesId);
      return false;
    }
    console.log('[updateEpisodeFirebase] Series found, episodes count:', series.episodes?.length);

    const updatedEpisodes = series.episodes.map(ep => {
      if (ep.episodeId === episodeId) {
        // Special handling for Italian translations
        if (updates.language === 'it') {
          const italianUpdates: any = {};
          
          // Map fields to their Italian counterparts
          if (updates.title) italianUpdates.title_it = updates.title;
          if (updates.description !== undefined) italianUpdates.description_it = updates.description;
          if (updates.audioPath) italianUpdates.audioPath_it = updates.audioPath;
          if (updates.videoPath) italianUpdates.videoPath_it = updates.videoPath;
          if (updates.thumbnailPath) italianUpdates.thumbnailPath_it = updates.thumbnailPath;
          
          // Return episode with Italian fields updated, preserving English fields
          return {
            ...ep,
            ...italianUpdates,
            // Update non-language-specific fields
            ...Object.fromEntries(
              Object.entries(updates).filter(([key]) => 
                !['title', 'description', 'language', 'audioPath', 'videoPath', 'thumbnailPath'].includes(key)
              )
            )
          };
        }
        // Normal update for English or other fields
        return { ...ep, ...updates };
      }
      return ep;
    });

    const database = getDb();
    if (!database) {
      console.error('[updateEpisodeFirebase] Database not initialized');
      return false;
    }
    
    console.log('[updateEpisodeFirebase] Updating Firestore document');
    await updateDoc(doc(database, 'series', seriesId), {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
    });
    console.log('[updateEpisodeFirebase] Update successful');

    return true;
  } catch (error) {
    console.error('[updateEpisodeFirebase] Error updating episode:', error);
    if (error instanceof Error) {
      console.error('[updateEpisodeFirebase] Error message:', error.message);
      console.error('[updateEpisodeFirebase] Error stack:', error.stack);
    }
    return false;
  }
}

// Delete episode
export async function deleteEpisodeFirebase(
  seriesId: string,
  episodeId: string
): Promise<boolean> {
  try {
    const series = await getSeriesFirebase(seriesId);
    if (!series) {
      return false;
    }

    const updatedEpisodes = series.episodes.filter(ep => ep.episodeId !== episodeId);

    await updateDoc(doc(db, 'series', seriesId), {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Delete episode error:', error);
    return false;
  }
}

// Check if customer has unlocked episode
export async function isEpisodeUnlockedFirebase(
  customerId: string,
  seriesId: string,
  episodeNumber: number
): Promise<boolean> {
  try {
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    if (!customerDoc.exists()) {
      return false;
    }

    const customer = customerDoc.data();
    const unlockedEpisodes = customer.unlockedEpisodes || [];

    return unlockedEpisodes.some(
      (ep: any) => ep.seriesId === seriesId && ep.episodeNumber === episodeNumber
    );
  } catch (error) {
    console.error('Check unlock error:', error);
    return false;
  }
}

// Get a specific episode by episode ID across all series
export async function getSeriesEpisode(episodeId: string): Promise<FirebaseEpisode & { seriesId: string } | null> {
  try {
    const database = getDb();
    if (!database) {
      console.warn('Firestore not initialized');
      return null;
    }
    
    // Get all series and search for the episode
    const seriesSnapshot = await getDocs(collection(database, 'series'));
    
    for (const doc of seriesSnapshot.docs) {
      const series = doc.data() as FirebaseSeries;
      const episode = series.episodes?.find(ep => ep.episodeId === episodeId);
      
      if (episode) {
        return {
          ...episode,
          seriesId: doc.id
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Get episode error:', error);
    return null;
  }
}