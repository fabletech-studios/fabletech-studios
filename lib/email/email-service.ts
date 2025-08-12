import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.ionos.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'admin@fabletech.studio',
    pass: process.env.EMAIL_PASSWORD || ''
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
};

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransporter(emailConfig);
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using IONOS SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.error('EMAIL_PASSWORD not configured in environment variables');
      return false;
    }
    
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FableTech Studios'}" <${process.env.EMAIL_USER || 'admin@fabletech.studio'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    console.log('Attempting to send email to:', options.to);
    console.log('Using SMTP:', emailConfig.host, 'Port:', emailConfig.port);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Email sending failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string, isGoogleAuth: boolean = false) {
  const subject = 'Welcome to FableTech Studios! 🎉';
  
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
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .credits { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FableTech Studios!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          
          <p>Thank you for joining FableTech Studios, your premium destination for audiobooks and digital content.</p>
          
          <div class="credits">
            <h3>🎁 Your Welcome Gift</h3>
            <p><strong>100 FREE CREDITS</strong> have been added to your account!</p>
            <p>Use them to unlock premium episodes and explore our library.</p>
          </div>
          
          ${isGoogleAuth ? 
            '<p>You signed up using your Google account, so you can log in anytime with just one click!</p>' :
            '<p>You can now log in with your email and password to start exploring our content.</p>'
          }
          
          <center>
            <a href="https://www.fabletech.studio/browse" class="button">Browse Content</a>
          </center>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Explore our growing library of audiobooks</li>
            <li>Use your free credits to unlock episodes</li>
            <li>Purchase additional credits anytime</li>
            <li>Enjoy content in multiple languages</li>
          </ul>
          
          <p>If you have any questions, feel free to reach out to us at admin@fabletech.studio</p>
          
          <p>Happy listening!</p>
          <p><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
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
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const subject = 'Reset Your FableTech Studios Password';
  
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
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          
          <p>We received a request to reset your password for your FableTech Studios account.</p>
          
          <p>Click the button below to create a new password:</p>
          
          <center>
            <a href="${resetLink}" class="button">Reset Password</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          
          <div class="warning">
            <p><strong>⚠️ Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
            </ul>
          </div>
          
          <p>For security reasons, we never send passwords via email.</p>
          
          <p>Best regards,<br><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
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
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(
  email: string, 
  name: string, 
  credits: number, 
  amount: number
) {
  const subject = `Purchase Confirmation - ${credits} Credits`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Successful! ✅</h1>
        </div>
        <div class="content">
          <h2>Thank you for your purchase, ${name}!</h2>
          
          <div class="receipt">
            <h3>Order Details</h3>
            <table style="width: 100%;">
              <tr>
                <td><strong>Item:</strong></td>
                <td>${credits} Credits</td>
              </tr>
              <tr>
                <td><strong>Amount Paid:</strong></td>
                <td>$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Date:</strong></td>
                <td>${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong></td>
                <td style="color: #10b981;">✓ Credits Added</td>
              </tr>
            </table>
          </div>
          
          <p>Your ${credits} credits have been added to your account and are ready to use!</p>
          
          <center>
            <a href="https://www.fabletech.studio/browse" class="button">Start Listening</a>
          </center>
          
          <p>Thank you for supporting FableTech Studios!</p>
          
          <p>Best regards,<br><strong>The FableTech Studios Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 FableTech Studios. All rights reserved.</p>
          <p>This receipt was sent to ${email}</p>
          <p>Keep this email for your records</p>
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