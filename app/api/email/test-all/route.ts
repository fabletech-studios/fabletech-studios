import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/email-service';
import { sendNewEpisodeNotification, sendPromotionalEmail, sendWeeklyNewsletter } from '@/lib/email/promotional-emails';
import { sendSimpleEmail } from '@/lib/email/simple-email';

export async function POST(request: NextRequest) {
  try {
    const { email, testType } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    let result = false;
    let message = '';
    
    switch (testType) {
      case 'welcome':
        // Try simple email first for testing
        result = await sendSimpleEmail(
          email,
          'Welcome to FableTech Studios!',
          '<h1>Welcome!</h1><p>Thank you for joining FableTech Studios. You have received 100 free credits!</p>'
        );
        message = 'Welcome email sent';
        break;
        
      case 'episode':
        result = await sendNewEpisodeNotification(
          email,
          'Test User',
          'The Adventure Series',
          'The Hidden Path',
          5,
          'Join our heroes as they discover a mysterious path that leads to unexpected adventures.',
          'test-series-id'
        );
        message = 'Episode notification sent';
        break;
        
      case 'promotional':
        result = await sendPromotionalEmail(
          email,
          'Test User',
          'Holiday Special - Save Big!',
          'Get ready for amazing stories this holiday season with our special credit packages.',
          30,
          'HOLIDAY30',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        );
        message = 'Promotional email sent';
        break;
        
      case 'newsletter':
        result = await sendWeeklyNewsletter(
          email,
          'Test User',
          [
            {
              title: 'Mystery at Midnight',
              description: 'A thrilling detective story that will keep you on the edge of your seat.',
              id: 'mystery-midnight'
            },
            {
              title: 'Journey to the Stars',
              description: 'An epic sci-fi adventure across the galaxy.',
              id: 'journey-stars'
            }
          ],
          150
        );
        message = 'Newsletter sent';
        break;
        
      default:
        // Send all emails as a test
        const results = await Promise.all([
          sendWelcomeEmail(email, 'Test User', true),
          sendNewEpisodeNotification(
            email,
            'Test User',
            'The Adventure Series',
            'The Hidden Path',
            5,
            'Join our heroes as they discover a mysterious path.',
            'test-series-id'
          ),
          sendPromotionalEmail(
            email,
            'Test User',
            'Special Offer',
            'Limited time offer on credit packages.',
            25,
            'SAVE25',
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
          ),
          sendWeeklyNewsletter(
            email,
            'Test User',
            [{
              title: 'Featured Story',
              description: 'An amazing story awaits.',
              id: 'featured-1'
            }],
            100
          )
        ]);
        
        result = results.every(r => r);
        message = 'All test emails sent';
    }
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: message
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Check SMTP configuration.' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}