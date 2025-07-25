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
  episodes: FirebaseEpisode[];
  createdAt: any;
  updatedAt?: any;
}

export interface FirebaseEpisode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  videoPath?: string;
  audioPath?: string;
  thumbnailPath?: string;
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
    const series = await getSeriesFirebase(seriesId);
    if (!series) {
      return false;
    }

    const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEpisode: FirebaseEpisode = {
      ...episode,
      episodeId
    };

    const updatedEpisodes = [...series.episodes, newEpisode];
    
    const database = getDb();
    if (!database) return false;
    
    await updateDoc(doc(database, 'series', seriesId), {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Add episode error:', error);
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
    const series = await getSeriesFirebase(seriesId);
    if (!series) {
      return false;
    }

    const updatedEpisodes = series.episodes.map(ep => 
      ep.episodeId === episodeId ? { ...ep, ...updates } : ep
    );

    await updateDoc(doc(db, 'series', seriesId), {
      episodes: updatedEpisodes,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Update episode error:', error);
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