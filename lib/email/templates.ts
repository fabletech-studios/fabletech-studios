// Email templates - configure actual emails in environment variables

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'Your Company <noreply@yourdomain.com>',
  support: process.env.EMAIL_SUPPORT || 'support@yourdomain.com',
  billing: process.env.EMAIL_BILLING || 'billing@yourdomain.com',
  hello: process.env.EMAIL_HELLO || 'hello@yourdomain.com',
  admin: process.env.EMAIL_ADMIN || 'admin@yourdomain.com'
};

export const emailTemplates = {
  welcome: (userName: string) => ({
    subject: 'Welcome to FableTech Studio!',
    html: `
      <h2>Welcome to FableTech Studio, ${userName}!</h2>
      <p>Thank you for joining our premium audiobook platform.</p>
      <p>Start exploring our collection at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}">${process.env.NEXT_PUBLIC_APP_URL || 'yourdomain.com'}</a></p>
      <p>If you have any questions, contact us at ${emailConfig.support}</p>
    `
  }),
  
  paymentConfirmation: (amount: string, credits: number) => ({
    subject: 'Payment Confirmation - FableTech Studio',
    html: `
      <h2>Payment Confirmed</h2>
      <p>Thank you for your purchase!</p>
      <ul>
        <li>Amount: ${amount}</li>
        <li>Credits: ${credits}</li>
      </ul>
      <p>Your credits are now available in your account.</p>
      <p>Visit <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard">your dashboard</a> to start listening.</p>
    `
  }),
  
  passwordReset: (resetLink: string) => ({
    subject: 'Password Reset - FableTech Studio',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  })
};
