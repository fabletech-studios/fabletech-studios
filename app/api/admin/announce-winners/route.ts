import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    
    if (!session || !adminEmails.includes(session.user?.email || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { winners, announcementMessage, sendNotifications, publishToSite } = await request.json();

    // Validate winners
    if (!winners.first) {
      return NextResponse.json(
        { success: false, error: 'First place winner is required' },
        { status: 400 }
      );
    }

    // Update contest with winners
    const contestSnapshot = await adminDb
      .collection('contests')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (contestSnapshot.empty) {
      // If no active contest found, update the most recent one
      const recentContestSnapshot = await adminDb
        .collection('contests')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!recentContestSnapshot.empty) {
        await recentContestSnapshot.docs[0].ref.update({
          winners,
          winnerAnnouncedAt: FieldValue.serverTimestamp(),
          announcementMessage,
          status: 'announced'
        });
      }
    } else {
      await contestSnapshot.docs[0].ref.update({
        winners,
        winnerAnnouncedAt: FieldValue.serverTimestamp(),
        announcementMessage,
        status: 'announced'
      });
    }

    // Update winning submissions
    const updatePromises = [];
    
    // Update first place
    if (winners.first) {
      updatePromises.push(
        adminDb.collection('submissions').doc(winners.first).update({
          placement: 'first',
          placementDate: FieldValue.serverTimestamp()
        })
      );
    }
    
    // Update second place
    if (winners.second) {
      updatePromises.push(
        adminDb.collection('submissions').doc(winners.second).update({
          placement: 'second',
          placementDate: FieldValue.serverTimestamp()
        })
      );
    }
    
    // Update third place
    if (winners.third) {
      updatePromises.push(
        adminDb.collection('submissions').doc(winners.third).update({
          placement: 'third',
          placementDate: FieldValue.serverTimestamp()
        })
      );
    }
    
    // Update honorable mentions
    if (winners.honorableMentions && winners.honorableMentions.length > 0) {
      winners.honorableMentions.forEach((submissionId: string) => {
        updatePromises.push(
          adminDb.collection('submissions').doc(submissionId).update({
            placement: 'honorable',
            placementDate: FieldValue.serverTimestamp()
          })
        );
      });
    }

    await Promise.all(updatePromises);

    // Send notifications if enabled
    if (sendNotifications && adminDb) {
      const notificationPromises = [];
      
      // Get winner details for notifications
      const winnerIds = [
        winners.first,
        winners.second,
        winners.third,
        ...winners.honorableMentions
      ].filter(Boolean);
      
      const winnerSubmissions = await adminDb
        .collection('submissions')
        .where(adminDb.FieldPath.documentId(), 'in', winnerIds)
        .get();
      
      winnerSubmissions.docs.forEach(doc => {
        const submission = doc.data();
        const placement = 
          doc.id === winners.first ? '1st Place 🥇' :
          doc.id === winners.second ? '2nd Place 🥈' :
          doc.id === winners.third ? '3rd Place 🥉' :
          'Honorable Mention ⭐';
        
        // Create in-app notification
        notificationPromises.push(
          adminDb.collection('notifications').add({
            userId: submission.authorId,
            type: 'contest_winner',
            title: 'Congratulations! You Won!',
            message: `Your story "${submission.title}" won ${placement} in the contest!`,
            metadata: {
              contestId: submission.contestId,
              submissionId: doc.id,
              placement: placement.toLowerCase().replace(/[^a-z]/g, '')
            },
            read: false,
            createdAt: FieldValue.serverTimestamp()
          })
        );
        
        // Send email notification
        if (submission.authorEmail) {
          notificationPromises.push(
            sendEmail({
              to: submission.authorEmail,
              subject: `🎉 Congratulations! You Won ${placement}!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #8B5CF6;">Congratulations! 🎉</h1>
                  <p>Dear ${submission.authorName},</p>
                  <p>We're thrilled to announce that your story <strong>"${submission.title}"</strong> has won <strong>${placement}</strong> in our contest!</p>
                  ${announcementMessage ? `<p>${announcementMessage}</p>` : ''}
                  <p>Your exceptional storytelling has captured the hearts of our community, and we're honored to recognize your achievement.</p>
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h2 style="margin: 0;">${placement}</h2>
                    <p style="margin: 5px 0 0 0;">${submission.title}</p>
                  </div>
                  <p>Visit the contest page to see the full results and celebrate with the community!</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/contest" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Contest Results</a>
                  <p style="margin-top: 30px; color: #666;">Best regards,<br>The FableTech Studios Team</p>
                </div>
              `,
              text: `Congratulations! Your story "${submission.title}" has won ${placement} in our contest!`
            }).catch(err => console.error('Failed to send winner email:', err))
          );
        }
      });
      
      await Promise.all(notificationPromises);
    }

    // Create public announcement if enabled
    if (publishToSite && adminDb) {
      await adminDb.collection('announcements').add({
        type: 'contest_winners',
        title: 'Contest Winners Announced!',
        message: announcementMessage || 'The contest winners have been announced! Congratulations to all participants!',
        winners,
        visible: true,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Winners announced successfully'
    });

  } catch (error: any) {
    console.error('Error announcing winners:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to announce winners' },
      { status: 500 }
    );
  }
}