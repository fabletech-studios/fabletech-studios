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
      await setDoc(userRatingRef, {
        seriesId,
        episodeId,
        episodeNumber,
        rating,
        isFavorite: newFavoriteStatus,
        updatedAt: serverTimestamp()
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
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>Sign in to rate this episode</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Rating Stars */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Rate this episode:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isLoading}
                className={`transition-all duration-200 ${
                  isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
                }`}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-sm text-gray-400 ml-2">
              You rated: {rating}/5
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isFavorite
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
          } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          <span className="text-sm">{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
        </button>
      </div>

      {/* Average Rating Display */}
      {totalRatings > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span>
              {averageRating.toFixed(1)} average ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}