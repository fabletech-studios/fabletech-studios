import { adminDb } from './admin';
import admin from 'firebase-admin';
import { FirebaseEpisode } from './content-service';

// Add episode to series using Admin SDK
export async function addEpisodeFirebaseAdmin(
  seriesId: string, 
  episode: Omit<FirebaseEpisode, 'episodeId'>
): Promise<boolean> {
  try {
    console.log('[addEpisodeFirebaseAdmin] Starting for series:', seriesId);
    console.log('[addEpisodeFirebaseAdmin] Episode data:', episode);
    
    if (!adminDb) {
      console.error('[addEpisodeFirebaseAdmin] Admin database not initialized');
      return false;
    }
    
    // Get the series document
    const seriesRef = adminDb.collection('series').doc(seriesId);
    const seriesDoc = await seriesRef.get();
    
    if (!seriesDoc.exists) {
      console.error('[addEpisodeFirebaseAdmin] Series not found:', seriesId);
      return false;
    }
    
    const seriesData = seriesDoc.data();
    console.log('[addEpisodeFirebaseAdmin] Series found:', seriesData?.title);
    console.log('[addEpisodeFirebaseAdmin] Current episodes count:', seriesData?.episodes?.length || 0);

    // Generate episode ID
    const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEpisode: FirebaseEpisode = {
      ...episode,
      episodeId
    };
    console.log('[addEpisodeFirebaseAdmin] New episode with ID:', episodeId);

    // Update episodes array
    const updatedEpisodes = [...(seriesData?.episodes || []), newEpisode];
    console.log('[addEpisodeFirebaseAdmin] Updated episodes count:', updatedEpisodes.length);
    
    // Update the document using Admin SDK
    await seriesRef.update({
      episodes: updatedEpisodes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('[addEpisodeFirebaseAdmin] Document updated successfully');

    return true;
  } catch (error) {
    console.error('[addEpisodeFirebaseAdmin] Error adding episode:', error);
    if (error instanceof Error) {
      console.error('[addEpisodeFirebaseAdmin] Error message:', error.message);
      console.error('[addEpisodeFirebaseAdmin] Error stack:', error.stack);
    }
    return false;
  }
}

// Get series by ID using Admin SDK
export async function getSeriesFirebaseAdmin(seriesId: string) {
  try {
    if (!adminDb) {
      console.error('[getSeriesFirebaseAdmin] Admin database not initialized');
      return null;
    }
    
    const seriesDoc = await adminDb.collection('series').doc(seriesId).get();
    
    if (!seriesDoc.exists) {
      return null;
    }
    
    return {
      id: seriesDoc.id,
      ...seriesDoc.data()
    };
  } catch (error) {
    console.error('[getSeriesFirebaseAdmin] Error getting series:', error);
    return null;
  }
}