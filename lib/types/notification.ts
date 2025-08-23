// Notification Types and Interfaces

export type NotificationType = 
  | 'contest_submission_approved'
  | 'contest_submission_rejected'
  | 'contest_voting_started'
  | 'contest_voting_ended'
  | 'contest_winner'
  | 'new_vote_received'
  | 'credit_purchase'
  | 'credit_bonus'
  | 'story_comment'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  
  // Optional metadata based on notification type
  metadata?: {
    contestId?: string;
    contestTitle?: string;
    submissionId?: string;
    submissionTitle?: string;
    voteCount?: number;
    creditAmount?: number;
    placement?: 'first' | 'second' | 'third' | 'honorable';
    link?: string; // Where to navigate when clicked
  };
  
  // Status
  read: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date; // Optional expiration for time-sensitive notifications
}

// Helper functions
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'contest_submission_approved': return '✅';
    case 'contest_submission_rejected': return '❌';
    case 'contest_voting_started': return '🗳️';
    case 'contest_voting_ended': return '⏰';
    case 'contest_winner': return '🏆';
    case 'new_vote_received': return '👍';
    case 'credit_purchase': return '💳';
    case 'credit_bonus': return '🎁';
    case 'story_comment': return '💬';
    case 'system_announcement': return '📢';
    default: return '📬';
  }
}

export function getNotificationPriority(type: NotificationType): 'high' | 'medium' | 'low' {
  switch (type) {
    case 'contest_winner':
    case 'credit_purchase':
    case 'system_announcement':
      return 'high';
    
    case 'contest_submission_approved':
    case 'contest_submission_rejected':
    case 'contest_voting_started':
    case 'contest_voting_ended':
    case 'new_vote_received':
      return 'medium';
    
    case 'credit_bonus':
    case 'story_comment':
    default:
      return 'low';
  }
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}