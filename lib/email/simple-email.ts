import nodemailer from 'nodemailer';

// Simpler email configuration for IONOS
export async function sendSimpleEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // Only proceed if all email config is present
    if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_USER) {
      console.error('Email configuration missing');
      return false;
    }

    // Create transporter with minimal config
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"FableTech Studios" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, '') // Plain text version
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Email error:', error.message);
    return false;
  }
}