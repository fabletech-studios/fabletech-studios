import { sendEmail } from './email-service';

/**
 * Send notification about new episode release
 */
export async function sendNewEpisodeNotification(
  email: string,
  userName: string,
  seriesTitle: string,
  episodeTitle: string,
  episodeNumber: number,
  description: string,
  seriesId: string
) {
  const subject = `New Episode Available: ${seriesTitle} - Episode ${episodeNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .episode-card { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .unsubscribe { color: #666; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎧 New Episode Released!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          
          <p>Great news! A new episode of <strong>${seriesTitle}</strong> is now available.</p>
          
          <div class="episode-card">
            <h3>${episodeTitle}</h3>
            <p><strong>Episode ${episodeNumber}</strong></p>
            <p>${description}</p>
          </div>
          
          <center>
            <a href="https://www.fabletech.studio/series/${seriesId}" class="button">Listen Now</a>
          </center>
          
          <p>Don't miss out on this exciting new episode!</p>
          
          <p>Happy listening,<br><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>You're receiving this because you're subscribed to updates for ${seriesTitle}</p>
          <p><a href="https://www.fabletech.studio/settings/notifications" class="unsubscribe">Manage email preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Send promotional email for special offers
 */
export async function sendPromotionalEmail(
  email: string,
  userName: string,
  offerTitle: string,
  offerDescription: string,
  discountPercent: number,
  promoCode: string,
  expiryDate: string
) {
  const subject = `🎉 Special Offer: ${offerTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .offer-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .promo-code { background: white; color: #333; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 15px 0; }
        .button { display: inline-block; padding: 15px 40px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .timer { background: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${offerTitle}</h1>
          <h2>Save ${discountPercent}% Today!</h2>
        </div>
        <div class="content">
          <h2>Hello ${userName}! 🎊</h2>
          
          <p>${offerDescription}</p>
          
          <div class="offer-box">
            <h3>YOUR EXCLUSIVE DISCOUNT</h3>
            <div class="promo-code">${promoCode}</div>
            <p>Use this code at checkout for ${discountPercent}% off</p>
          </div>
          
          <div class="timer">
            <strong>⏰ Limited Time Offer</strong><br>
            Expires: ${expiryDate}
          </div>
          
          <center>
            <a href="https://www.fabletech.studio/pricing" class="button">Claim Your Discount</a>
          </center>
          
          <h3>Why FableTech Studios?</h3>
          <ul>
            <li>📚 Extensive library of premium audiobooks</li>
            <li>🌍 Content in multiple languages</li>
            <li>🎧 High-quality audio production</li>
            <li>📱 Listen anywhere, anytime</li>
            <li>💳 Flexible credit packages</li>
          </ul>
          
          <p>Don't miss out on this special offer!</p>
          
          <p>Best regards,<br><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>This promotional email was sent to ${email}</p>
          <p><a href="https://www.fabletech.studio/unsubscribe" style="color: #666;">Unsubscribe from promotional emails</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Send weekly newsletter with recommendations
 */
export async function sendWeeklyNewsletter(
  email: string,
  userName: string,
  featuredSeries: Array<{title: string, description: string, id: string}>,
  userCredits: number
) {
  const subject = `📚 Your Weekly FableTech Digest`;
  
  const seriesHtml = featuredSeries.map(series => `
    <div style="background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; margin: 10px 0;">
      <h4>${series.title}</h4>
      <p>${series.description}</p>
      <a href="https://www.fabletech.studio/series/${series.id}" style="color: #dc2626;">Listen Now →</a>
    </div>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credits-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Weekly FableTech Digest</h1>
          <p>Discover new stories and adventures</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}! 📖</h2>
          
          <p>Here's what's trending this week at FableTech Studios:</p>
          
          <div class="credits-badge">
            Your Credits: ${userCredits}
          </div>
          
          <h3>🌟 Featured Series</h3>
          ${seriesHtml}
          
          <center>
            <a href="https://www.fabletech.studio/browse" class="button">Explore More</a>
          </center>
          
          <h3>💡 Did You Know?</h3>
          <p>You can download episodes for offline listening! Perfect for your commute or travels.</p>
          
          <p>Happy listening!<br><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>You're receiving this weekly digest as a FableTech Studios member</p>
          <p><a href="https://www.fabletech.studio/settings/notifications" style="color: #666;">Manage email preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}