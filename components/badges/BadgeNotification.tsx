'use client';

import React, { useEffect, useState } from 'react';
import { Badge, BADGES } from '@/lib/badges/badge-definitions';
import {
  FirstListenBadge,
  BingeMasterBadge,
  SupporterBadge,
  VIPListenerBadge,
  CompletionistBadge,
  EarlyAdopterBadge,
  BadgeContainer
} from './BadgeIcons';
import { Trophy, X } from 'lucide-react';

// Map badge IDs to their components
const BADGE_COMPONENTS: { [key: string]: React.FC<any> } = {
  first_listen: FirstListenBadge,
  binge_master: BingeMasterBadge,
  supporter: SupporterBadge,
  vip_listener: VIPListenerBadge,
  completionist: CompletionistBadge,
  early_adopter: EarlyAdopterBadge,
};

interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badgeIds, onClose }) => {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (badgeIds.length === 0) return null;

  const currentBadgeId = badgeIds[currentBadgeIndex];
  const badge = BADGES.find(b => b.id === currentBadgeId);
  
  if (!badge) return null;

  const BadgeIcon = BADGE_COMPONENTS[badge.id];
  if (!BadgeIcon) return null;

  const handleNext = () => {
    if (currentBadgeIndex < badgeIds.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-600 to-gray-500';
      case 'rare': return 'from-blue-600 to-blue-500';
      case 'epic': return 'from-purple-600 to-purple-500';
      case 'legendary': return 'from-red-600 to-red-500';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-gray-900 rounded-lg p-8 max-w-md w-full transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold">Badge Earned!</h2>
          </div>
          <div className={`h-1 w-32 mx-auto rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)}`} />
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="animate-bounce">
            <BadgeContainer rarity={badge.rarity} earned={true} showAnimation={true}>
              <BadgeIcon size={120} rarity={badge.rarity} earned={true} />
            </BadgeContainer>
          </div>
        </div>

        {/* Badge Info */}
        <div className="text-center space-y-3 mb-6">
          <h3 className="text-xl font-bold">{badge.name}</h3>
          <p className="text-gray-400">{badge.description}</p>
          <p className="text-sm text-green-400">{badge.earnedMessage}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          {badgeIds.length > 1 && currentBadgeIndex < badgeIds.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Next Badge ({currentBadgeIndex + 1}/{badgeIds.length})
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Awesome!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeNotification;