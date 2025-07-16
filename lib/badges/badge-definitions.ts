export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'listener' | 'supporter' | 'completionist' | 'author';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  criteria: {
    type: 'episodes_unlocked' | 'credits_purchased' | 'series_completed' | 'account_age' | 'episodes_in_row' | 'author_submission';
    value: number;
    timeframe?: number; // in days
  };
  iconComponent: string; // Name of the React component
  earnedMessage: string;
}

export const BADGES: Badge[] = [
  // Listener Achievements
  {
    id: 'first_listen',
    name: 'First Listen',
    description: 'Unlocked your first episode',
    category: 'listener',
    rarity: 'common',
    criteria: {
      type: 'episodes_unlocked',
      value: 1
    },
    iconComponent: 'FirstListenBadge',
    earnedMessage: 'Welcome to FableTech Studios! You\'ve begun your audiobook journey.'
  },
  {
    id: 'binge_master',
    name: 'Binge Master',
    description: 'Unlocked 5 episodes in a single day',
    category: 'listener',
    rarity: 'rare',
    criteria: {
      type: 'episodes_in_row',
      value: 5,
      timeframe: 1
    },
    iconComponent: 'BingeMasterBadge',
    earnedMessage: 'Impressive! You\'re a true binge listener.'
  },
  {
    id: 'supporter',
    name: 'Supporter',
    description: 'Purchased credits for the first time',
    category: 'supporter',
    rarity: 'common',
    criteria: {
      type: 'credits_purchased',
      value: 1
    },
    iconComponent: 'SupporterBadge',
    earnedMessage: 'Thank you for supporting FableTech Studios!'
  },
  {
    id: 'vip_listener',
    name: 'VIP Listener',
    description: 'Purchased over 500 credits total',
    category: 'supporter',
    rarity: 'epic',
    criteria: {
      type: 'credits_purchased',
      value: 500
    },
    iconComponent: 'VIPListenerBadge',
    earnedMessage: 'You\'re a VIP! Thank you for your exceptional support.'
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Completed an entire series',
    category: 'completionist',
    rarity: 'rare',
    criteria: {
      type: 'series_completed',
      value: 1
    },
    iconComponent: 'CompletionistBadge',
    earnedMessage: 'Amazing! You\'ve completed an entire series.'
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during the beta period',
    category: 'listener',
    rarity: 'legendary',
    criteria: {
      type: 'account_age',
      value: 0 // Special check for beta period
    },
    iconComponent: 'EarlyAdopterBadge',
    earnedMessage: 'Thank you for being an early supporter of FableTech Studios!'
  }
];

// Badge rarity colors and effects
export const RARITY_STYLES = {
  common: {
    borderColor: '#6B7280', // gray-500
    glowColor: 'rgba(107, 114, 128, 0.5)',
    particleColor: '#9CA3AF'
  },
  rare: {
    borderColor: '#3B82F6', // blue-500
    glowColor: 'rgba(59, 130, 246, 0.5)',
    particleColor: '#60A5FA'
  },
  epic: {
    borderColor: '#8B5CF6', // purple-500
    glowColor: 'rgba(139, 92, 246, 0.5)',
    particleColor: '#A78BFA'
  },
  legendary: {
    borderColor: '#EF4444', // red-500
    glowColor: 'rgba(239, 68, 68, 0.5)',
    particleColor: '#F87171'
  }
};