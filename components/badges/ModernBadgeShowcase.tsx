'use client';

import React, { useEffect, useState } from 'react';
import { Badge, BADGES, BadgeRarity } from '@/lib/badges/badge-definitions';
import { getUserBadges, getUserBadgeProgress, checkAndAwardBadges, UserBadge, BadgeProgress } from '@/lib/firebase/badge-service';
import { Trophy, Lock, TrendingUp, Sparkles, Star, Award, Zap, Target, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernBadgeShowcaseProps {
  userId: string;
  userStats?: any;
}

const ModernBadgeShowcase: React.FC<ModernBadgeShowcaseProps> = ({ userId, userStats }) => {
  const [earnedBadges, setEarnedBadges] = useState<(Badge & UserBadge)[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [userId, userStats]);

  const loadBadges = async () => {
    try {
      console.log('[Badges] Loading badges for user:', userId);
      console.log('[Badges] User stats:', userStats);
      
      const [earned, progress] = await Promise.all([
        getUserBadges(userId),
        userStats ? getUserBadgeProgress(userId, userStats) : Promise.resolve([])
      ]);
      
      console.log('[Badges] Earned badges:', earned);
      console.log('[Badges] Badge progress:', progress);
      
      setEarnedBadges(earned);
      setBadgeProgress(progress);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkForNewBadges = async () => {
    if (!userStats) return;
    
    setChecking(true);
    try {
      console.log('[Badges] Manually checking for new badges with stats:', userStats);
      const newBadges = await checkAndAwardBadges(userId, userStats);
      console.log('[Badges] New badges awarded:', newBadges);
      
      if (newBadges.length > 0) {
        // Reload badges to show newly earned ones
        await loadBadges();
      }
    } catch (error) {
      console.error('Error checking for badges:', error);
    } finally {
      setChecking(false);
    }
  };

  const getRarityGradient = (rarity: BadgeRarity, earned: boolean = false) => {
    if (!earned) return 'from-gray-700 via-gray-600 to-gray-700';
    
    switch (rarity) {
      case 'common': return 'from-emerald-400 via-green-500 to-emerald-600';
      case 'rare': return 'from-blue-400 via-sky-500 to-blue-600';
      case 'epic': return 'from-purple-400 via-pink-500 to-purple-600';
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-600';
    }
  };
  
  const getRarityShimmer = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common': return 'from-transparent via-green-300/30 to-transparent';
      case 'rare': return 'from-transparent via-blue-300/40 to-transparent';
      case 'epic': return 'from-transparent via-purple-300/50 to-transparent';
      case 'legendary': return 'from-transparent via-yellow-300/60 to-transparent';
    }
  };

  const getRarityIcon = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Sparkles className="w-4 h-4" />;
      case 'epic': return <Zap className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
    }
  };

  const getRarityLabel = (rarity: BadgeRarity) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const getBadgeIcon = (badgeId: string, size: number = 32) => {
    const iconClass = `w-${size/4} h-${size/4}`;
    switch(badgeId) {
      case 'first_listen':
        return <Award className={iconClass} />;
      case 'binge_master':
        return <Zap className={iconClass} />;
      case 'supporter':
        return <Star className={iconClass} />;
      case 'vip_listener':
        return <Crown className={iconClass} />;
      case 'completionist':
        return <Target className={iconClass} />;
      case 'early_adopter':
        return <Sparkles className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded-lg w-48 mb-6"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Earned Badges Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Achievements</h2>
              <p className="text-gray-400 text-sm mt-1">
                {earnedBadges.length} of {BADGES.length} badges earned
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userStats && userStats.episodesUnlocked > earnedBadges.length && (
              <motion.button
                onClick={checkForNewBadges}
                disabled={checking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full text-white font-medium text-sm hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {checking ? 'Checking...' : '🔍 Check for Badges'}
              </motion.button>
            )}
            {earnedBadges.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
              >
                <span className="text-white font-semibold text-sm">
                  {Math.round((earnedBadges.length / BADGES.length) * 100)}% Complete
                </span>
              </motion.div>
            )}
          </div>
        </div>
        
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.button
                key={badge.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBadge(badge)}
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
                className="relative aspect-square group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getRarityGradient(badge.rarity, true)} rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                <div className={`relative h-full bg-gradient-to-br ${getRarityGradient(badge.rarity, true)} rounded-2xl p-4 border-2 border-white/30 shadow-xl overflow-hidden`}>
                  {/* Shimmer effect for earned badges */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${getRarityShimmer(badge.rarity)}`}
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                    style={{ width: '200%' }}
                  />
                  <div className="relative flex items-center justify-center h-full text-white drop-shadow-lg">
                    {getBadgeIcon(badge.id)}
                  </div>
                  <div className="absolute top-1 right-1 text-white/90">
                    {getRarityIcon(badge.rarity)}
                  </div>
                </div>
                {hoveredBadge === badge.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10"
                  >
                    {badge.name}
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-800 rounded-full mb-4">
              <Lock className="w-12 h-12 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No badges earned yet</p>
            <p className="text-gray-500 text-sm">Start your journey by unlocking episodes!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Badge Progress Section */}
      {badgeProgress.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Next Achievements</h3>
          </div>
          
          <div className="space-y-4">
            {badgeProgress.slice(0, 3).map((progress, index) => {
              const badge = BADGES.find(b => b.id === progress.badgeId);
              if (!badge) return null;
              
              return (
                <motion.div 
                  key={progress.badgeId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-all cursor-pointer"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="relative"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className={`w-16 h-16 bg-gradient-to-br ${getRarityGradient(badge.rarity, false)} rounded-xl flex items-center justify-center`}>
                        {getBadgeIcon(badge.id, 24)}
                      </div>
                      <div className="absolute -top-1 -right-1">
                        {getRarityIcon(badge.rarity)}
                      </div>
                    </motion.div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-white">{badge.name}</span>
                          <span className="ml-2 text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                            {getRarityLabel(badge.rarity)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {progress.currentValue} / {progress.targetValue}
                        </span>
                      </div>
                      
                      <div className="relative h-4 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                          className={`absolute h-full bg-gradient-to-r ${
                            progress.percentage >= 75 ? 'from-green-400 to-emerald-500' :
                            progress.percentage >= 50 ? 'from-yellow-400 to-orange-500' :
                            progress.percentage >= 25 ? 'from-orange-400 to-red-500' :
                            'from-gray-400 to-gray-500'
                          } shadow-lg`}
                        >
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '100%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                            style={{ width: '50%' }}
                          />
                        </motion.div>
                        {/* Percentage text on the bar */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow-md">
                            {progress.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">{badge.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* All Badges Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">All Achievements</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BADGES.map((badge, index) => {
            const isEarned = earnedBadges.some(b => b.id === badge.id);
            const progress = badgeProgress.find(p => p.badgeId === badge.id);
            
            return (
              <motion.button
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBadge(badge)}
                className={`group relative bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all ${
                  isEarned ? 'ring-2 ring-green-500/50' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <motion.div 
                      className={`w-20 h-20 bg-gradient-to-br ${getRarityGradient(badge.rarity, isEarned)} rounded-2xl flex items-center justify-center overflow-hidden ${
                        !isEarned ? 'grayscale opacity-60' : 'shadow-lg'
                      }`}
                      animate={isEarned ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 3, delay: index * 0.2 }}
                    >
                      {isEarned && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r ${getRarityShimmer(badge.rarity)}`}
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut"
                          }}
                          style={{ width: '200%' }}
                        />
                      )}
                      <div className={`relative ${isEarned ? 'text-white drop-shadow-lg' : 'text-gray-400'}`}>
                        {getBadgeIcon(badge.id)}
                      </div>
                    </motion.div>
                    {isEarned && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-medium text-white text-sm">{badge.name}</h4>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {getRarityIcon(badge.rarity)}
                      <span className="text-xs text-gray-400">{getRarityLabel(badge.rarity)}</span>
                    </div>
                  </div>
                  
                  {!isEarned && progress && (
                    <div className="w-full">
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {progress.percentage}%
                      </p>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedBadge.name}</h3>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex justify-center mb-6">
                <motion.div 
                  className="relative"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className={`w-32 h-32 bg-gradient-to-br ${
                    getRarityGradient(selectedBadge.rarity, earnedBadges.some(b => b.id === selectedBadge.id))
                  } rounded-3xl flex items-center justify-center shadow-2xl`}>
                    {getBadgeIcon(selectedBadge.id, 48)}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-2">
                    {getRarityIcon(selectedBadge.rarity)}
                  </div>
                </motion.div>
              </div>
              
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
                  {getRarityIcon(selectedBadge.rarity)}
                  <span className="text-sm font-medium text-gray-300">
                    {getRarityLabel(selectedBadge.rarity)} Badge
                  </span>
                </div>
                
                <p className="text-gray-400">{selectedBadge.description}</p>
                
                {earnedBadges.some(b => b.id === selectedBadge.id) ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Earned!</span>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Requirement:</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {selectedBadge.criteria.type === 'episodes_unlocked' && `Unlock ${selectedBadge.criteria.value} episode${selectedBadge.criteria.value > 1 ? 's' : ''}`}
                        {selectedBadge.criteria.type === 'credits_purchased' && `Purchase ${selectedBadge.criteria.value} credits`}
                        {selectedBadge.criteria.type === 'series_completed' && `Complete ${selectedBadge.criteria.value} series`}
                        {selectedBadge.criteria.type === 'episodes_in_row' && `Unlock ${selectedBadge.criteria.value} episodes in ${selectedBadge.criteria.timeframe} day${selectedBadge.criteria.timeframe! > 1 ? 's' : ''}`}
                        {selectedBadge.criteria.type === 'account_age' && 'Be an early adopter'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernBadgeShowcase;