// Contest System Types - Designed for easy upgrade to hybrid model

export interface Contest {
  id: string;
  title: string;
  description: string;
  theme?: string; // Optional theme like "mystery", "romance", etc.
  status: 'upcoming' | 'submission' | 'voting' | 'judging' | 'announced' | 'completed';
  submissionStartDate: Date;
  submissionEndDate: Date;
  votingStartDate: Date;
  votingEndDate: Date;
  maxWordCount: number;
  minWordCount: number;
  prizes: {
    first: ContestPrize;
    second?: ContestPrize;
    third?: ContestPrize;
  };
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
  // Winner information
  winners?: {
    first: string;
    second?: string;
    third?: string;
    honorableMentions?: string[];
  };
  winnerAnnouncedAt?: Date;
  announcementMessage?: string;
  // Ready for hybrid model
  audioEnabled?: boolean;
  referralBonus?: number; // Credits for using ElevenLabs referral
}

export interface ContestPrize {
  credits: number;
  production: boolean; // Will be voiced by FableTech
  royaltyPercentage?: number; // Revenue share
  badge?: string; // Special badge for winners
  feature?: boolean; // Featured on homepage
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  authorId: string;
  authorName: string; // Pen name
  authorEmail?: string; // Author email for notifications
  title: string;
  genre: string[];
  synopsis: string; // 300 word max
  content: string; // Full story text
  wordCount: number;
  coverImageUrl?: string;
  
  // Voting data
  votes: {
    free: number;
    premium: number; // Costs credits
    super: number; // Costs more credits
    total: number; // Weighted total
  };
  
  // Status tracking
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'winner' | 'finalist';
  submittedAt: Date;
  updatedAt: Date;
  
  // Ready for hybrid model - optional audio fields
  audioPreviewUrl?: string; // Author's ElevenLabs preview
  audioProvider?: 'elevenlabs' | 'other';
  narratorPreference?: string;
  hasAudioBonus?: boolean; // Gets visibility boost
  
  // Engagement metrics
  views: number;
  shares: number;
  comments: number;
  
  // Moderation
  isApproved: boolean;
  moderationNotes?: string;
  isFeatured: boolean; // Paid boost
}

export interface ContestVote {
  id: string;
  contestId: string;
  submissionId: string;
  userId: string;
  voteType: 'free' | 'premium' | 'super';
  voteWeight: number; // 1 for free, 3 for premium, 10 for super
  creditCost: number;
  votedAt: Date;
  // Track source for analytics
  source?: 'web' | 'mobile' | 'shared-link';
}

export interface AuthorProfile {
  userId: string;
  penName: string;
  bio: string;
  profileImageUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  
  // Stats
  totalSubmissions: number;
  contestWins: number;
  totalVotesReceived: number;
  totalCreditsEarned: number;
  
  // Achievements
  badges: string[];
  level: 'novice' | 'emerging' | 'established' | 'featured';
  
  // Hybrid model ready
  hasElevenLabsAccount?: boolean;
  referralCode?: string;
  audioSamplesCreated?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Voting packages for monetization
export interface VotingPackage {
  id: string;
  name: string;
  description: string;
  votes: {
    free: number;
    premium: number;
    super: number;
  };
  creditCost: number;
  bonusFeatures?: string[]; // e.g., "See detailed stats", "Early results"
}

// For tracking user voting history and limits
export interface UserContestActivity {
  userId: string;
  contestId: string;
  votesUsed: {
    free: number;
    premium: number;
    super: number;
  };
  votesRemaining: {
    free: number;
    premium: number;
    super: number;
  };
  lastVoteAt?: Date;
  dailyVotesClaimed: boolean;
  streakDays: number;
  // Engagement tracking
  submissionsViewed: string[];
  submissionsShared: string[];
  commentsLeft: number;
}

// Contest-related notifications
export interface ContestNotification {
  id: string;
  userId: string;
  type: 'submission_approved' | 'new_vote' | 'contest_win' | 'contest_start' | 'voting_open';
  title: string;
  message: string;
  contestId?: string;
  submissionId?: string;
  isRead: boolean;
  createdAt: Date;
}

// Analytics for contest performance
export interface ContestAnalytics {
  contestId: string;
  totalSubmissions: number;
  totalVotes: number;
  totalParticipants: number;
  creditRevenue: number;
  newUsersAcquired: number;
  socialShares: number;
  averageVotesPerSubmission: number;
  topGenres: string[];
  peakVotingTime?: Date;
  // Hybrid model metrics
  audioSubmissions?: number;
  elevenLabsReferrals?: number;
  referralRevenue?: number;
}