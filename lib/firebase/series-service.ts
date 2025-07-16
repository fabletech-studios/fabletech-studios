// Series management service using Firestore without Firebase Auth
import { db } from './config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import type { Series, Episode } from '@/lib/types';

const SERIES_COLLECTION = 'series';
const EPISODES_COLLECTION = 'episodes';

// Series operations
export async function createSeries(seriesData: Omit<Series, 'id'>): Promise<Series | null> {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, SERIES_COLLECTION), {
      ...seriesData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    if (newDoc.exists()) {
      return { id: docRef.id, ...newDoc.data() } as Series;
    }
    return null;
  } catch (error) {
    console.error('Error creating series:', error);
    return null;
  }
}

export async function getSeries(seriesId: string): Promise<Series | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, SERIES_COLLECTION, seriesId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Series;
    }
    return null;
  } catch (error) {
    console.error('Error getting series:', error);
    return null;
  }
}

export async function getAllSeries(): Promise<Series[]> {
  if (!db) return [];

  try {
    const q = query(collection(db, SERIES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Series[];
  } catch (error) {
    console.error('Error getting all series:', error);
    return [];
  }
}

export async function updateSeries(seriesId: string, updates: Partial<Series>): Promise<boolean> {
  if (!db) return false;

  try {
    const docRef = doc(db, SERIES_COLLECTION, seriesId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating series:', error);
    return false;
  }
}

export async function deleteSeries(seriesId: string): Promise<boolean> {
  if (!db) return false;

  try {
    // Delete all episodes first
    const episodesQuery = query(
      collection(db, EPISODES_COLLECTION), 
      where('seriesId', '==', seriesId)
    );
    const episodesSnapshot = await getDocs(episodesQuery);
    
    const deletePromises = episodesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the series
    await deleteDoc(doc(db, SERIES_COLLECTION, seriesId));
    return true;
  } catch (error) {
    console.error('Error deleting series:', error);
    return false;
  }
}

// Episode operations
export async function createEpisode(episodeData: Omit<Episode, 'id'>): Promise<Episode | null> {
  if (!db) return null;

  try {
    const docRef = await addDoc(collection(db, EPISODES_COLLECTION), {
      ...episodeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    if (newDoc.exists()) {
      return { id: docRef.id, ...newDoc.data() } as Episode;
    }
    return null;
  } catch (error) {
    console.error('Error creating episode:', error);
    return null;
  }
}

export async function getEpisode(episodeId: string): Promise<Episode | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, EPISODES_COLLECTION, episodeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Episode;
    }
    return null;
  } catch (error) {
    console.error('Error getting episode:', error);
    return null;
  }
}

export async function getSeriesEpisodes(seriesId: string): Promise<Episode[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, EPISODES_COLLECTION), 
      where('seriesId', '==', seriesId),
      orderBy('episodeNumber', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Episode[];
  } catch (error) {
    console.error('Error getting series episodes:', error);
    return [];
  }
}

export async function updateEpisode(episodeId: string, updates: Partial<Episode>): Promise<boolean> {
  if (!db) return false;

  try {
    const docRef = doc(db, EPISODES_COLLECTION, episodeId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating episode:', error);
    return false;
  }
}

export async function deleteEpisode(episodeId: string): Promise<boolean> {
  if (!db) return false;

  try {
    await deleteDoc(doc(db, EPISODES_COLLECTION, episodeId));
    return true;
  } catch (error) {
    console.error('Error deleting episode:', error);
    return false;
  }
}

// Search functionality
export async function searchSeries(searchTerm: string): Promise<Series[]> {
  if (!db) return [];

  try {
    // For a simple search, we'll get all series and filter client-side
    // In production, you'd want to use a proper search solution
    const allSeries = await getAllSeries();
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return allSeries.filter(series => 
      series.title.toLowerCase().includes(lowercaseSearch) ||
      series.description.toLowerCase().includes(lowercaseSearch) ||
      series.author?.toLowerCase().includes(lowercaseSearch)
    );
  } catch (error) {
    console.error('Error searching series:', error);
    return [];
  }
}