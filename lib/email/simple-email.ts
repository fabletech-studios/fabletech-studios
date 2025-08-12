// Simpler email configuration for IONOS
export async function sendSimpleEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import for nodemailer
    const nodemailer = await import('nodemailer');
    
    // Only proceed if all email config is present
    if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_USER) {
      return { success: false, error: 'Email configuration missing' };
    }

    // Create transporter with minimal config
    const transporter = nodemailer.default.createTransporter({
      host: 'smtp.ionos.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      return { success: false, error: `SMTP verification failed: ${verifyError.message}` };
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"FableTech Studios" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, '') // Plain text version
    });

    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('Email error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
}