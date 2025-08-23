// Contest Types and Interfaces

export type ContestStatus = 'draft' | 'upcoming' | 'submission' | 'voting' | 'ended' | 'announced';
export type ContestCategory = 'fiction' | 'non-fiction' | 'poetry' | 'screenplay' | 'general';

export interface Contest {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: ContestCategory;
  genres: string[]; // ['thriller', 'romance', 'sci-fi', etc.]
  
  // Visual elements
  bannerImage?: string;
  thumbnailImage?: string;
  
  // Prizes
  prizes: {
    first: {
      title: string;
      description: string;
      value: string; // "$1000" or "Publishing Deal"
      icon?: string;
    };
    second?: {
      title: string;
      description: string;
      value: string;
      icon?: string;
    };
    third?: {
      title: string;
      description: string;
      value: string;
      icon?: string;
    };
    honorableMentions?: number; // Number of honorable mentions
  };
  
  // Rules and requirements
  rules: {
    minWords: number;
    maxWords: number;
    eligibility: string[]; // ["18+", "US residents", etc.]
    submissionLimit: number; // Max submissions per user
    allowMultipleSubmissions: boolean;
  };
  
  // Dates and phases
  status: ContestStatus;
  dates: {
    announced: Date;
    submissionStart: Date;
    submissionEnd: Date;
    votingStart: Date;
    votingEnd: Date;
    winnersAnnounced: Date;
  };
  
  // Voting configuration
  voting: {
    allowMultipleVotes: boolean;
    votesPerUser?: number; // null = unlimited
    voteTypes: {
      free: boolean;
      premium: boolean;
      super: boolean;
    };
  };
  
  // Statistics
  stats: {
    totalSubmissions: number;
    totalVotes: number;
    totalParticipants: number;
    totalViews: number;
  };
  
  // Winners (populated after contest ends)
  winners?: {
    first?: string; // submission ID
    second?: string;
    third?: string;
    honorableMentions?: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // admin user ID
  featured: boolean; // Show on homepage
  slug: string; // URL-friendly version of title
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  contestTitle: string;
  
  // Author info
  authorId: string;
  authorName: string;
  authorEmail: string;
  
  // Story content
  title: string;
  synopsis: string;
  content: string;
  genre: string[];
  wordCount: number;
  coverImageUrl?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'disqualified';
  statusReason?: string;
  
  // Voting
  votes: {
    free: number;
    premium: number;
    super: number;
    total: number;
    weightedTotal: number; // premium*2 + super*5 + free
  };
  
  // Analytics
  views: number;
  shares: number;
  
  // Timestamps
  submittedAt: Date;
  approvedAt?: Date;
  updatedAt: Date;
  
  // Results
  placement?: 'first' | 'second' | 'third' | 'honorable';
  prizeClaimed?: boolean;
}

export interface ContestVote {
  id: string;
  contestId: string;
  submissionId: string;
  voterId: string;
  voterEmail: string;
  voteType: 'free' | 'premium' | 'super';
  voteWeight: number;
  votedAt: Date;
  ip?: string;
}

// Helper functions
export function getContestStatus(contest: Contest): ContestStatus {
  const now = new Date();
  
  if (contest.status === 'draft') return 'draft';
  if (contest.winners) return 'announced';
  
  if (now < contest.dates.submissionStart) return 'upcoming';
  if (now >= contest.dates.submissionStart && now <= contest.dates.submissionEnd) return 'submission';
  if (now >= contest.dates.votingStart && now <= contest.dates.votingEnd) return 'voting';
  if (now > contest.dates.votingEnd) return 'ended';
  
  return contest.status;
}

export function canSubmitToContest(contest: Contest): boolean {
  const status = getContestStatus(contest);
  return status === 'submission';
}

export function canVoteInContest(contest: Contest): boolean {
  const status = getContestStatus(contest);
  return status === 'voting';
}

export function getContestPhaseLabel(status: ContestStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'upcoming': return 'Coming Soon';
    case 'submission': return 'Accepting Submissions';
    case 'voting': return 'Voting Open';
    case 'ended': return 'Voting Ended';
    case 'announced': return 'Winners Announced';
    default: return 'Unknown';
  }
}

export function getContestPhaseColor(status: ContestStatus): string {
  switch (status) {
    case 'draft': return 'gray';
    case 'upcoming': return 'blue';
    case 'submission': return 'green';
    case 'voting': return 'purple';
    case 'ended': return 'orange';
    case 'announced': return 'gold';
    default: return 'gray';
  }
}