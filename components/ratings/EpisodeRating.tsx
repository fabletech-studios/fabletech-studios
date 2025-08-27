'use client';

import { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface EpisodeRatingProps {
  seriesId: string;
  episodeId: string;
  episodeNumber: number;
  onRatingUpdate?: (rating: number, isFavorite: boolean) => void;
}

export default function EpisodeRating({ 
  seriesId, 
  episodeId, 
  episodeNumber,
  onRatingUpdate 
}: EpisodeRatingProps) {
  const { customer } = useFirebaseCustomerAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Fetch user's rating and episode stats
  useEffect(() => {
    if (!customer) return;

    const fetchRatingData = async () => {
      try {
        // Fetch user's rating
        const userRatingRef = doc(db, 'users', customer.uid, 'ratings', `${seriesId}_${episodeId}`);
        const userRatingDoc = await getDoc(userRatingRef);
        
        if (userRatingDoc.exists()) {
          const data = userRatingDoc.data();
          setRating(data.rating || 0);
          setIsFavorite(data.isFavorite || false);
        }

        // Fetch episode stats
        const episodeStatsRef = doc(db, 'episodeStats', `${seriesId}_${episodeId}`);
        const episodeStatsDoc = await getDoc(episodeStatsRef);
        
        if (episodeStatsDoc.exists()) {
          const stats = episodeStatsDoc.data();
          setAverageRating(stats.averageRating || 0);
          setTotalRatings(stats.totalRatings || 0);
        }
      } catch (error) {
        console.error('Error fetching rating data:', error);
      }
    };

    fetchRatingData();
  }, [customer, seriesId, episodeId]);

  const handleRatingClick = async (newRating: number) => {
    if (!customer || isLoading) return;

    setIsLoading(true);
    const oldRating = rating;
    
    try {
      // Optimistic update
      setRating(newRating);

      // Update user's rating
      const userRatingRef = doc(db, 'users', customer.uid, 'ratings', `${seriesId}_${episodeId}`);
      await setDoc(userRatingRef, {
        seriesId,
        episodeId,
        episodeNumber,
        rating: newRating,
        isFavorite,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update episode stats
      const episodeStatsRef = doc(db, 'episodeStats', `${seriesId}_${episodeId}`);
      const episodeStatsDoc = await getDoc(episodeStatsRef);
      
      if (episodeStatsDoc.exists()) {
        const stats = episodeStatsDoc.data();
        const currentTotal = stats.totalRating || 0;
        const currentCount = stats.totalRatings || 0;
        
        // If user had a previous rating, update the total
        let newTotal = currentTotal;
        let newCount = currentCount;
        
        if (oldRating > 0) {
          newTotal = currentTotal - oldRating + newRating;
        } else {
          newTotal = currentTotal + newRating;
          newCount = currentCount + 1;
        }
        
        const newAverage = newCount > 0 ? newTotal / newCount : 0;
        
        await updateDoc(episodeStatsRef, {
          totalRating: newTotal,
          totalRatings: newCount,
          averageRating: newAverage,
          updatedAt: serverTimestamp()
        });
        
        setAverageRating(newAverage);
        setTotalRatings(newCount);
      } else {
        // Create new stats document
        await setDoc(episodeStatsRef, {
          seriesId,
          episodeId,
          episodeNumber,
          totalRating: newRating,
          totalRatings: 1,
          averageRating: newRating,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        setAverageRating(newRating);
        setTotalRatings(1);
      }

      if (onRatingUpdate) {
        onRatingUpdate(newRating, isFavorite);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      // Revert on error
      setRating(oldRating);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!customer || isLoading) return;

    setIsLoading(true);
    const newFavoriteStatus = !isFavorite;
    
    try {
      // Optimistic update
      setIsFavorite(newFavoriteStatus);

      // Update user's rating document
      const userRatingRef = doc(db, 'users', customer.uid, 'ratings', `${seriesId}_${episodeId}`);
      console.log('Updating favorite status:', { 
        path: `users/${customer.uid}/ratings/${seriesId}_${episodeId}`,
        isFavorite: newFavoriteStatus 
      });
      
      await setDoc(userRatingRef, {
        seriesId,
        episodeId,
        episodeNumber,
        rating: rating || 0,
        isFavorite: newFavoriteStatus,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // Add this in case it's the first time
      }, { merge: true });

      // Update episode stats for favorites count
      const episodeStatsRef = doc(db, 'episodeStats', `${seriesId}_${episodeId}`);
      const episodeStatsDoc = await getDoc(episodeStatsRef);
      
      if (episodeStatsDoc.exists()) {
        const stats = episodeStatsDoc.data();
        const currentFavorites = stats.totalFavorites || 0;
        
        await updateDoc(episodeStatsRef, {
          totalFavorites: newFavoriteStatus ? currentFavorites + 1 : Math.max(0, currentFavorites - 1),
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new stats document
        await setDoc(episodeStatsRef, {
          seriesId,
          episodeId,
          episodeNumber,
          totalRating: 0,
          totalRatings: 0,
          averageRating: 0,
          totalFavorites: newFavoriteStatus ? 1 : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (onRatingUpdate) {
        onRatingUpdate(rating, newFavoriteStatus);
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      // Revert on error
      setIsFavorite(!newFavoriteStatus);
    } finally {
      setIsLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="bg-black/50 backdrop-blur rounded-lg p-3 text-center">
        <p className="text-xs sm:text-sm text-gray-400">Sign in to rate this episode</p>
      </div>
    );
  }

  return (
    <div className="bg-black/50 backdrop-blur rounded-lg p-3 sm:p-4 overflow-hidden">
      {/* Compact single-line layout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Rating Section */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
          {/* Stars */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isLoading}
                className={`transition-all duration-200 ${
                  isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
                } p-0.5`}
              >
                <Star
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    star <= (hoverRating || rating)
                      ? 'fill-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-500'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Rating text - hide on very small screens */}
          {totalRatings > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <span className="font-medium text-gray-300">{averageRating.toFixed(1)}</span>
              <span>({totalRatings})</span>
            </div>
          )}
        </div>

        {/* Divider - hidden on mobile */}
        <div className="hidden sm:block h-4 w-px bg-gray-700" />

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Your rating indicator - compact */}
          {rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium">{rating}</span>
            </div>
          )}
          
          {/* Favorite button - icon only on mobile */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-all duration-200 ${
              isFavorite
                ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                : 'bg-gray-800/50 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400'
            } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline text-xs font-medium">
              {isFavorite ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile-only stats row */}
      {totalRatings > 0 && (
        <div className="sm:hidden mt-2 pt-2 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-300">{averageRating.toFixed(1)}</span>
            <span>average • {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}</span>
          </div>
        </div>
      )}
    </div>
  );
}