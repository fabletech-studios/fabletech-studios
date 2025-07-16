// Content service that works without Firebase Auth
// Uses Firestore directly for content management

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Enable offline persistence for better reliability
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export interface Series {
  id: string;
  title: string;
  description: string;
  author?: string;
  genre?: string;
  thumbnailUrl?: string;
  episodeCount: number;
  totalDuration?: string;
  tags?: string[];
  featured?: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  createdBy: string; // Local user ID
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  credits: number;
  isFree: boolean;
  transcriptUrl?: string;
  createdAt: any;
  updatedAt: any;
}

// Test Firestore connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Try to read from a collection
    const testDoc = doc(db, '_test_', 'connection');
    await setDoc(testDoc, { 
      test: true, 
      timestamp: serverTimestamp() 
    });
    
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      // Clean up test doc
      await deleteDoc(testDoc);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}

// Create a new series (no auth required)
export async function createSeriesNoAuth(
  seriesData: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string = 'local-admin'
) {
  try {
    const seriesRef = doc(collection(db, 'series'));
    const series = {
      ...seriesData,
      id: seriesRef.id,
      episodeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId
    };

    await setDoc(seriesRef, series);
    
    console.log('Series created in Firestore:', seriesRef.id);
    return { success: true, seriesId: seriesRef.id };
  } catch (error: any) {
    console.error('Error creating series:', error);
    
    // If Firestore fails, we could fall back to local storage
    if (error.code === 'unavailable') {
      console.warn('Firestore unavailable, consider local fallback');
    }
    
    return { success: false, error: error.message };
  }
}

// Get all series (public read)
export async function getAllSeriesNoAuth() {
  try {
    const seriesQuery = query(
      collection(db, 'series'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(seriesQuery);
    const series = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      // Convert Firestore timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as Series[];
    
    console.log(`Loaded ${series.length} series from Firestore`);
    return { success: true, series };
  } catch (error: any) {
    console.error('Error getting series:', error);
    return { success: false, error: error.message, series: [] };
  }
}

// Get series by ID
export async function getSeriesByIdNoAuth(seriesId: string) {
  try {
    const seriesDoc = await getDoc(doc(db, 'series', seriesId));
    
    if (!seriesDoc.exists()) {
      return { success: false, error: 'Series not found' };
    }
    
    const data = seriesDoc.data();
    return { 
      success: true, 
      series: { 
        ...data, 
        id: seriesDoc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Series 
    };
  } catch (error: any) {
    console.error('Error getting series:', error);
    return { success: false, error: error.message };
  }
}

// Create episode
export async function createEpisodeNoAuth(
  episodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const episodeRef = doc(collection(db, 'episodes'));
    const episode = {
      ...episodeData,
      id: episodeRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(episodeRef, episode);
    
    // Update episode count in series
    const seriesRef = doc(db, 'series', episodeData.seriesId);
    const seriesDoc = await getDoc(seriesRef);
    
    if (seriesDoc.exists()) {
      const currentCount = seriesDoc.data().episodeCount || 0;
      await updateDoc(seriesRef, {
        episodeCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('Episode created in Firestore:', episodeRef.id);
    return { success: true, episodeId: episodeRef.id };
  } catch (error: any) {
    console.error('Error creating episode:', error);
    return { success: false, error: error.message };
  }
}

// Get episodes by series
export async function getEpisodesBySeriesNoAuth(seriesId: string) {
  try {
    const episodesQuery = query(
      collection(db, 'episodes'),
      where('seriesId', '==', seriesId),
      orderBy('episodeNumber', 'asc')
    );
    
    const snapshot = await getDocs(episodesQuery);
    const episodes = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as Episode[];
    
    return { success: true, episodes };
  } catch (error: any) {
    console.error('Error getting episodes:', error);
    return { success: false, error: error.message, episodes: [] };
  }
}

// Update series
export async function updateSeriesNoAuth(
  seriesId: string, 
  updates: Partial<Series>
) {
  try {
    const seriesRef = doc(db, 'series', seriesId);
    await updateDoc(seriesRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating series:', error);
    return { success: false, error: error.message };
  }
}

// Delete episode
export async function deleteEpisodeNoAuth(
  episodeId: string, 
  seriesId: string
) {
  try {
    // Delete the episode
    await deleteDoc(doc(db, 'episodes', episodeId));
    
    // Update episode count in series
    const seriesRef = doc(db, 'series', seriesId);
    const seriesDoc = await getDoc(seriesRef);
    
    if (seriesDoc.exists()) {
      const currentCount = seriesDoc.data().episodeCount || 1;
      await updateDoc(seriesRef, {
        episodeCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting episode:', error);
    return { success: false, error: error.message };
  }
}

// Delete series and all its episodes
export async function deleteSeriesNoAuth(seriesId: string) {
  try {
    // First, delete all episodes
    const episodesQuery = query(
      collection(db, 'episodes'),
      where('seriesId', '==', seriesId)
    );
    
    const episodesSnapshot = await getDocs(episodesQuery);
    const deletePromises = episodesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Then delete the series
    await deleteDoc(doc(db, 'series', seriesId));
    
    console.log('Series and episodes deleted from Firestore');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting series:', error);
    return { success: false, error: error.message };
  }
}