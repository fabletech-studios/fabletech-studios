'use client';

import React, { useEffect, useState } from 'react';
import { Badge, BADGES } from '@/lib/badges/badge-definitions';
import { getUserBadges, UserBadge } from '@/lib/firebase/badge-service';
import {
  FirstListenBadge,
  BingeMasterBadge,
  SupporterBadge,
  VIPListenerBadge,
  CompletionistBadge,
  EarlyAdopterBadge,
  BadgeContainer
} from './BadgeIcons';
import { Trophy, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { motion, AnimatePresence } from 'framer-motion';

// Map badge IDs to their components
const BADGE_COMPONENTS: { [key: string]: React.FC<any> } = {
  first_listen: FirstListenBadge,
  binge_master: BingeMasterBadge,
  supporter: SupporterBadge,
  vip_listener: VIPListenerBadge,
  completionist: CompletionistBadge,
  early_adopter: EarlyAdopterBadge,
};

interface BadgeHorizontalBarProps {
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
}

const BadgeHorizontalBar: React.FC<BadgeHorizontalBarProps> = ({ isVisible, onToggle }) => {
  const { customer } = useFirebaseCustomerAuth();
  const [earnedBadges, setEarnedBadges] = useState<(Badge & UserBadge)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge & UserBadge | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (customer) {
      loadBadges();
    }
  }, [customer]);
  
  // Check dismissed state when visibility changes
  useEffect(() => {
    if (isVisible) {
      const dismissed = localStorage.getItem('badge-bar-dismissed');
      setIsDismissed(dismissed === 'true');
    }
  }, [isVisible]);
  
  // Reset dismissed state when toggled on
  useEffect(() => {
    if (isVisible && isDismissed) {
      setIsDismissed(false);
      localStorage.removeItem('badge-bar-dismissed');
    }
  }, [isVisible]);

  const loadBadges = async () => {
    if (!customer) return;
    
    try {
      const badges = await getUserBadges(customer.uid);
      setEarnedBadges(badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('badge-scroll-container');
    if (!container) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  useEffect(() => {
    const container = document.getElementById('badge-scroll-container');
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', checkScroll);
    checkScroll();

    return () => container.removeEventListener('scroll', checkScroll);
  }, [earnedBadges]);

  if (!customer) return null;

  return (
    <>
      {/* Badge Bar Container */}
      <AnimatePresence>
        {isVisible && !isDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden"
          >
            <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Header */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <h3 className="font-semibold text-xs sm:text-sm lg:text-base hidden sm:block">My Badges</h3>
                <span className="text-xs text-gray-400">
                  {earnedBadges.length}/{BADGES.length}
                </span>
              </div>

              {/* Scrollable Badge Container */}
              <div className="flex-1 relative">
                {/* Left Scroll Button */}
                {canScrollLeft && (
                  <button
                    onClick={() => handleScroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 hover:bg-gray-800 p-1 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Badge List */}
                <div
                  id="badge-scroll-container"
                  className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {loading ? (
                    // Loading skeletons
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded animate-pulse" />
                      ))}
                    </>
                  ) : earnedBadges.length > 0 ? (
                    // Earned badges
                    earnedBadges.map((badge) => {
                      const BadgeIcon = BADGE_COMPONENTS[badge.id];
                      if (!BadgeIcon) return null;
                      
                      return (
                        <motion.button
                          key={badge.id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBadge(badge)}
                          className="shrink-0 relative group"
                          title={badge.name}
                        >
                          <BadgeContainer rarity={badge.rarity} earned={true}>
                            <BadgeIcon size={40} rarity={badge.rarity} earned={true} />
                          </BadgeContainer>
                          
                          {/* Badge name on hover - desktop only */}
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                            {badge.name}
                          </div>
                        </motion.button>
                      );
                    })
                  ) : (
                    // No badges message
                    <div className="text-center text-gray-500 w-full py-2">
                      <p className="text-sm">Start watching to earn badges!</p>
                    </div>
                  )}
                </div>

                {/* Right Scroll Button */}
                {canScrollRight && (
                  <button
                    onClick={() => handleScroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 hover:bg-gray-800 p-1 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsDismissed(true);
                  localStorage.setItem('badge-bar-dismissed', 'true');
                  onToggle(false);
                }}
                className="shrink-0 text-gray-400 hover:text-white transition-colors p-1"
                title="Hide badges"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                {(() => {
                  const BadgeIcon = BADGE_COMPONENTS[selectedBadge.id];
                  return BadgeIcon ? (
                    <div className="mb-4 inline-block">
                      <BadgeContainer rarity={selectedBadge.rarity} earned={true}>
                        <BadgeIcon size={80} rarity={selectedBadge.rarity} earned={true} />
                      </BadgeContainer>
                    </div>
                  ) : null;
                })()}
                
                <h3 className="text-xl font-bold mb-2">{selectedBadge.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{selectedBadge.description}</p>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className={`capitalize px-2 py-1 rounded ${
                    selectedBadge.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedBadge.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                    selectedBadge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedBadge.rarity}
                  </span>
                  {selectedBadge.earnedDate && (
                    <span className="text-gray-500">
                      Earned {new Date(selectedBadge.earnedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BadgeHorizontalBar;