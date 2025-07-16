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
import { Trophy, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

// Map badge IDs to their components
const BADGE_COMPONENTS: { [key: string]: React.FC<any> } = {
  first_listen: FirstListenBadge,
  binge_master: BingeMasterBadge,
  supporter: SupporterBadge,
  vip_listener: VIPListenerBadge,
  completionist: CompletionistBadge,
  early_adopter: EarlyAdopterBadge,
};

interface BadgeSidebarProps {
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
}

const BadgeSidebar: React.FC<BadgeSidebarProps> = ({ isVisible, onToggle }) => {
  const { customer } = useFirebaseCustomerAuth();
  const [earnedBadges, setEarnedBadges] = useState<(Badge & UserBadge)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (customer) {
      loadBadges();
    }
  }, [customer]);

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

  if (!isVisible || !customer) return null;

  return (
    <>
      {/* Badge Sidebar */}
      <div 
        className={`fixed right-0 top-20 z-40 transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 h-[calc(100vh-5rem)] rounded-l-lg shadow-xl">
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-gray-900 border border-gray-800 border-r-0 rounded-l-lg p-2 hover:bg-gray-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            {isExpanded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">My Badges</h3>
                </div>
                <button
                  onClick={() => onToggle(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Hide badges"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            )}
          </div>

          {/* Badge List */}
          <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`${isExpanded ? 'h-16' : 'h-12 w-12 mx-auto'} bg-gray-800 rounded animate-pulse`} />
                ))}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className={`${isExpanded ? 'space-y-4' : 'space-y-3'}`}>
                {earnedBadges.map((badge) => {
                  const BadgeIcon = BADGE_COMPONENTS[badge.id];
                  if (!BadgeIcon) return null;
                  
                  return (
                    <div
                      key={badge.id}
                      className={`${
                        isExpanded 
                          ? 'flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors' 
                          : 'flex justify-center'
                      }`}
                      title={badge.name}
                    >
                      <BadgeContainer rarity={badge.rarity} earned={true}>
                        <BadgeIcon size={isExpanded ? 48 : 48} rarity={badge.rarity} earned={true} />
                      </BadgeContainer>
                      {isExpanded && (
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{badge.name}</h4>
                          <p className="text-xs text-gray-400 capitalize">{badge.rarity}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                {isExpanded ? (
                  <>
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No badges yet</p>
                  </>
                ) : (
                  <Trophy className="w-6 h-6 mx-auto opacity-50" />
                )}
              </div>
            )}
          </div>

          {/* Footer - Badge Count */}
          {isExpanded && earnedBadges.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-xs text-gray-400">
                {earnedBadges.length} / {BADGES.length} collected
              </p>
            </div>
          )}
        </div>
      </div>

    </>
  );
};

export default BadgeSidebar;