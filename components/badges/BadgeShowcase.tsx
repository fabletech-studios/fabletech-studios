'use client';

import React, { useEffect, useState } from 'react';
import { Badge, BADGES, BadgeRarity } from '@/lib/badges/badge-definitions';
import { getUserBadges, getUserBadgeProgress, UserBadge, BadgeProgress } from '@/lib/firebase/badge-service';
import {
  FirstListenBadge,
  BingeMasterBadge,
  SupporterBadge,
  VIPListenerBadge,
  CompletionistBadge,
  EarlyAdopterBadge,
  BadgeContainer
} from './BadgeIcons';
import { Trophy, Lock, TrendingUp } from 'lucide-react';

// Map badge IDs to their components
const BADGE_COMPONENTS: { [key: string]: React.FC<any> } = {
  first_listen: FirstListenBadge,
  binge_master: BingeMasterBadge,
  supporter: SupporterBadge,
  vip_listener: VIPListenerBadge,
  completionist: CompletionistBadge,
  early_adopter: EarlyAdopterBadge,
};

interface BadgeShowcaseProps {
  userId: string;
  userStats?: any;
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ userId, userStats }) => {
  const [earnedBadges, setEarnedBadges] = useState<(Badge & UserBadge)[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      const [earned, progress] = await Promise.all([
        getUserBadges(userId),
        userStats ? getUserBadgeProgress(userId, userStats) : Promise.resolve([])
      ]);
      
      setEarnedBadges(earned);
      setBadgeProgress(progress);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityLabel = (rarity: BadgeRarity) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const getRarityColor = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-red-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-20 h-20 bg-gray-800 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges Section */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Earned Badges
          </h2>
          <span className="text-sm text-gray-400">
            {earnedBadges.length} / {BADGES.length} collected
          </span>
        </div>
        
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {earnedBadges.map((badge) => {
              const BadgeIcon = BADGE_COMPONENTS[badge.id];
              if (!BadgeIcon) return null;
              
              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="group relative hover:scale-110 transition-transform"
                >
                  <BadgeContainer rarity={badge.rarity} earned={true}>
                    <BadgeIcon size={80} rarity={badge.rarity} earned={true} />
                  </BadgeContainer>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/90 rounded px-2 py-1 text-xs">
                      {badge.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No badges earned yet</p>
            <p className="text-sm mt-1">Complete activities to earn badges!</p>
          </div>
        )}
      </div>

      {/* Badge Progress Section */}
      {badgeProgress.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Badge Progress
          </h3>
          <div className="space-y-4">
            {badgeProgress.slice(0, 3).map((progress) => {
              const badge = BADGES.find(b => b.id === progress.badgeId);
              if (!badge) return null;
              
              return (
                <div key={progress.badgeId} className="flex items-center gap-4">
                  <div className="relative">
                    <Lock className="w-12 h-12 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{badge.name}</span>
                      <span className="text-sm text-gray-400">
                        {progress.currentValue} / {progress.targetValue}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Badges Grid */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">All Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BADGES.map((badge) => {
            const BadgeIcon = BADGE_COMPONENTS[badge.id];
            if (!BadgeIcon) return null;
            
            const isEarned = earnedBadges.some(b => b.id === badge.id);
            
            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <BadgeContainer rarity={badge.rarity} earned={isEarned}>
                  <BadgeIcon size={60} rarity={badge.rarity} earned={isEarned} />
                </BadgeContainer>
                <h4 className="font-medium mt-2 text-sm">{badge.name}</h4>
                <span className={`text-xs ${getRarityColor(badge.rarity)}`}>
                  {getRarityLabel(badge.rarity)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedBadge.name}</h3>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="flex justify-center mb-4">
              {(() => {
                const BadgeIcon = BADGE_COMPONENTS[selectedBadge.id];
                if (!BadgeIcon) return null;
                const isEarned = earnedBadges.some(b => b.id === selectedBadge.id);
                
                return (
                  <BadgeContainer rarity={selectedBadge.rarity} earned={isEarned}>
                    <BadgeIcon size={120} rarity={selectedBadge.rarity} earned={isEarned} />
                  </BadgeContainer>
                );
              })()}
            </div>
            
            <div className="text-center space-y-2">
              <p className={`text-sm font-medium ${getRarityColor(selectedBadge.rarity)}`}>
                {getRarityLabel(selectedBadge.rarity)} Badge
              </p>
              <p className="text-gray-400">{selectedBadge.description}</p>
              {earnedBadges.some(b => b.id === selectedBadge.id) && (
                <p className="text-green-400 text-sm">✓ Earned</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeShowcase;