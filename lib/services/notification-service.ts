import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Notification, NotificationType } from '@/lib/types/notification';

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async send(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const notification = {
        userId,
        type,
        title,
        message,
        metadata,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        // Notifications expire after 30 days by default
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      await adminDb.collection('notifications').add(notification);
      
      // Update user's unread count
      await adminDb.collection('customers').doc(userId).update({
        unreadNotifications: FieldValue.increment(1)
      });

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulk(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    const batch = adminDb.batch();
    const timestamp = FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (const userId of userIds) {
      const notificationRef = adminDb.collection('notifications').doc();
      batch.set(notificationRef, {
        userId,
        type,
        title,
        message,
        metadata,
        read: false,
        createdAt: timestamp,
        expiresAt
      });

      // Update unread count
      const userRef = adminDb.collection('customers').doc(userId);
      batch.update(userRef, {
        unreadNotifications: FieldValue.increment(1)
      });
    }

    await batch.commit();
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notificationRef = adminDb.collection('notifications').doc(notificationId);
      const doc = await notificationRef.get();

      if (!doc.exists || doc.data()?.userId !== userId) {
        return false;
      }

      if (!doc.data()?.read) {
        await notificationRef.update({
          read: true,
          readAt: FieldValue.serverTimestamp()
        });

        // Decrement unread count
        await adminDb.collection('customers').doc(userId).update({
          unreadNotifications: FieldValue.increment(-1)
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const batch = adminDb.batch();
      const timestamp = FieldValue.serverTimestamp();

      const unreadNotifications = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      unreadNotifications.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: timestamp
        });
      });

      // Reset unread count
      batch.update(adminDb.collection('customers').doc(userId), {
        unreadNotifications: 0
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async cleanupExpired(): Promise<void> {
    try {
      const now = new Date();
      const expiredNotifications = await adminDb
        .collection('notifications')
        .where('expiresAt', '<', now)
        .get();

      const batch = adminDb.batch();
      let count = 0;

      expiredNotifications.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Cleaned up ${count} expired notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  /**
   * Notification templates for common events
   */
  static async notifySubmissionApproved(
    userId: string,
    contestTitle: string,
    submissionTitle: string,
    contestId: string,
    submissionId: string
  ) {
    return this.send(
      userId,
      'contest_submission_approved',
      '✅ Submission Approved!',
      `Your story "${submissionTitle}" has been approved for the ${contestTitle}. Good luck!`,
      {
        contestId,
        contestTitle,
        submissionId,
        submissionTitle,
        link: `/contest/submission/${submissionId}`
      }
    );
  }

  static async notifySubmissionRejected(
    userId: string,
    contestTitle: string,
    submissionTitle: string,
    reason: string
  ) {
    return this.send(
      userId,
      'contest_submission_rejected',
      '❌ Submission Not Approved',
      `Your story "${submissionTitle}" for ${contestTitle} was not approved. ${reason}`,
      {
        contestTitle,
        submissionTitle
      }
    );
  }

  static async notifyVotingStarted(
    userIds: string[],
    contestTitle: string,
    contestId: string
  ) {
    return this.sendBulk(
      userIds,
      'contest_voting_started',
      '🗳️ Voting Has Started!',
      `Voting is now open for the ${contestTitle}. Cast your votes for your favorite stories!`,
      {
        contestId,
        contestTitle,
        link: `/contest/${contestId}`
      }
    );
  }

  static async notifyContestWinner(
    userId: string,
    contestTitle: string,
    placement: string,
    prize: string
  ) {
    return this.send(
      userId,
      'contest_winner',
      '🏆 Congratulations! You Won!',
      `You placed ${placement} in the ${contestTitle}! Prize: ${prize}`,
      {
        contestTitle,
        placement,
        link: '/contest/winners'
      }
    );
  }

  static async notifyNewVote(
    userId: string,
    submissionTitle: string,
    voteType: string,
    totalVotes: number
  ) {
    return this.send(
      userId,
      'new_vote_received',
      '👍 New Vote Received!',
      `Your story "${submissionTitle}" received a ${voteType} vote! Total votes: ${totalVotes}`,
      {
        submissionTitle,
        voteCount: totalVotes
      }
    );
  }

  static async notifyCreditPurchase(
    userId: string,
    credits: number,
    amount: number
  ) {
    return this.send(
      userId,
      'credit_purchase',
      '💳 Purchase Successful!',
      `You've successfully purchased ${credits} credits for $${amount.toFixed(2)}.`,
      {
        creditAmount: credits,
        link: '/profile'
      }
    );
  }
}