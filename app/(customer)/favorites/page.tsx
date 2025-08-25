'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Heart, Play, Star, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProxiedImage from '@/components/ProxiedImage';
import CustomerHeader from '@/components/CustomerHeader';
import PremiumLogo from '@/components/PremiumLogo';
import MobileNav from '@/components/MobileNav';
import MainNavigation from '@/components/MainNavigation';

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
        console.log('Fetching favorites from:', `users/${customer.uid}/ratings`);
        
        // Get all ratings first, then filter client-side to avoid index issues
        const snapshot = await getDocs(ratingsRef);
        console.log('Total ratings docs:', snapshot.size);
        
        // Filter for favorites client-side
        const favoriteDocs = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.isFavorite === true;
        });
        console.log('Found favorites:', favoriteDocs.length);
        
        const favoritesList: FavoriteEpisode[] = [];
        
        for (const doc of favoriteDocs) {
          const data = doc.data();
          console.log('Favorite doc:', doc.id, data);
          const favorite: FavoriteEpisode = {
            id: doc.id,
            ...data
          } as FavoriteEpisode;
          
          // Fetch series and episode details
          try {
            const seriesRes = await fetch(`/api/content`);
            if (seriesRes.ok) {
              const contentData = await seriesRes.json();
              const series = contentData.series?.find((s: any) => s.id === data.seriesId);
              
              if (series) {
                favorite.seriesTitle = series.title;
              
                // Find the episode in the series
                const episode = series.episodes?.find((ep: any) => 
                  ep.episodeId === data.episodeId || ep.episodeNumber === data.episodeNumber
                );
                
                if (episode) {
                  favorite.episodeTitle = episode.title;
                  favorite.thumbnailPath = episode.thumbnailPath;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching series details:', error);
          }
          
          favoritesList.push(favorite);
        }
        
        // Sort by updatedAt (most recent first)
        favoritesList.sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime;
        });
        
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
      <div className="min-h-screen bg-black text-white">
        <MobileNav />
        <header className="hidden md:block fixed top-0 w-full bg-gradient-to-b from-black via-black/95 to-transparent z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <PremiumLogo size="md" />
                <div className="h-6 w-px bg-gray-700" />
                <MainNavigation />
              </div>
              <CustomerHeader />
            </div>
          </nav>
        </header>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign in to view favorites</h2>
            <p className="text-gray-400">Please sign in to see your favorite episodes</p>
            <Link href="/login" className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <MobileNav />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <MobileNav />
        <header className="hidden md:block fixed top-0 w-full bg-gradient-to-b from-black via-black/95 to-transparent z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <PremiumLogo size="md" />
                <div className="h-6 w-px bg-gray-700" />
                <MainNavigation />
              </div>
              <CustomerHeader />
            </div>
          </nav>
        </header>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800 sticky top-0 z-50 bg-black/90 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <PremiumLogo size="md" />
              <div className="h-6 w-px bg-gray-700" />
              <MainNavigation />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="pt-16 md:pt-20">
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
      </main>
    </div>
  );
}