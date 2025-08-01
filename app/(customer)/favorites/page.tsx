'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Heart, Play, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ProxiedImage from '@/components/ProxiedImage';

interface FavoriteEpisode {
  id: string;
  seriesId: string;
  episodeId: string;
  episodeNumber: number;
  rating: number;
  isFavorite: boolean;
  updatedAt: any;
  // Additional data we'll fetch
  seriesTitle?: string;
  episodeTitle?: string;
  thumbnailPath?: string;
}

export default function FavoritesPage() {
  const { customer } = useFirebaseCustomerAuth();
  const [favorites, setFavorites] = useState<FavoriteEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      setIsLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        // Get user's favorites
        const ratingsRef = collection(db, 'users', customer.uid, 'ratings');
        const q = query(ratingsRef, where('isFavorite', '==', true), orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const favoritesList: FavoriteEpisode[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const favorite: FavoriteEpisode = {
            id: doc.id,
            ...data
          } as FavoriteEpisode;
          
          // Fetch series and episode details
          try {
            const seriesRes = await fetch(`/api/content/series/${data.seriesId}`);
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              favorite.seriesTitle = seriesData.title;
              
              // Find the episode in the series
              const episode = seriesData.episodes?.find((ep: any) => 
                ep.episodeId === data.episodeId || ep.episodeNumber === data.episodeNumber
              );
              
              if (episode) {
                favorite.episodeTitle = episode.title;
                favorite.thumbnailPath = episode.thumbnailPath;
              }
            }
          } catch (error) {
            console.error('Error fetching series details:', error);
          }
          
          favoritesList.push(favorite);
        }
        
        setFavorites(favoritesList);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [customer]);

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view favorites</h2>
          <p className="text-gray-400">Please sign in to see your favorite episodes</p>
          <Link href="/auth" className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
          <p className="text-gray-400 mb-4">Episodes you mark as favorites will appear here</p>
          <Link href="/browse" className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors inline-block">
            Browse Episodes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
        <p className="text-gray-400">Episodes you've marked as favorites</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <Link
            key={favorite.id}
            href={`/watch/uploaded/${favorite.seriesId}/${favorite.episodeNumber}`}
            className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group"
          >
            <div className="relative aspect-video">
              {favorite.thumbnailPath ? (
                <ProxiedImage
                  src={favorite.thumbnailPath}
                  alt={favorite.episodeTitle || `Episode ${favorite.episodeNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Heart className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white" fill="currentColor" />
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold mb-1">
                {favorite.seriesTitle || 'Unknown Series'}
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Episode {favorite.episodeNumber}: {favorite.episodeTitle || 'Untitled'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {favorite.rating > 0 && (
                    <>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= favorite.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </>
                  )}
                </div>
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}