# FableTech Studio Business Email Setup Guide

## Overview
This guide covers setting up professional email addresses with IONOS for fabletech.studio domain.

## Email Addresses to Create

### 1. Primary Business Emails
- **admin@yourdomain.com** - Platform administration
- **support@yourdomain.com** - Customer support
- **billing@fabletech.studio** - Payment and billing inquiries
- **hello@fabletech.studio** - General inquiries

### 2. System Emails
- **noreply@yourdomain.com** - Automated notifications
- **alerts@fabletech.studio** - System alerts and monitoring

## IONOS Email Setup Steps

### Step 1: Access IONOS Email & Office
1. Log into IONOS Control Panel
2. Navigate to "Email & Office" section
3. Select "Email Accounts"

### Step 2: Create Email Accounts

#### Admin Email
```
Email address: admin@yourdomain.com
Display name: FableTech Admin
Storage: 2 GB (minimum)
Password: [Strong password - save in password manager]
```

#### Support Email
```
Email address: support@yourdomain.com
Display name: FableTech Support
Storage: 5 GB (recommended for attachments)
Password: [Strong password - save in password manager]
```

#### Billing Email
```
Email address: billing@fabletech.studio
Display name: FableTech Billing
Storage: 2 GB
Password: [Strong password - save in password manager]
```

#### Hello Email
```
Email address: hello@fabletech.studio
Display name: FableTech Studio
Storage: 2 GB
Password: [Strong password - save in password manager]
```

### Step 3: Configure Email Forwarding

Set up forwarding rules to manage emails efficiently:

1. **Support Forwarding**
   - Forward support@yourdomain.com → Your personal email
   - Keep copy in mailbox: Yes

2. **Billing Forwarding**
   - Forward billing@fabletech.studio → Your personal email
   - Keep copy in mailbox: Yes

### Step 4: Configure Email Clients

#### IONOS Webmail Access
- URL: https://mail.ionos.com
- Username: Full email address
- Password: As set above

#### IMAP Settings (for email clients)
```
Incoming Server (IMAP):
- Server: imap.ionos.com
- Port: 993
- Security: SSL/TLS
- Username: Full email address
- Password: As set

Outgoing Server (SMTP):
- Server: smtp.your-provider.com
- Port: 587
- Security: STARTTLS
- Authentication: Required
- Username: Full email address
- Password: As set
```

### Step 5: Configure SPF, DKIM, and DMARC

Add these DNS records in IONOS:

#### SPF Record
```
Type: TXT
Host: @
Value: "v=spf1 include:_spf.ionos.com ~all"
TTL: 3600
```

#### DKIM (if available in IONOS)
```
Follow IONOS instructions to enable DKIM
This helps prevent email spoofing
```

#### DMARC Record
```
Type: TXT
Host: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com"
TTL: 3600
```

## Email Integration with Application

### Step 1: Update Application Email Configuration

Create `.env` variables:
```bash
# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-smtp-password-here

# Business Emails
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
BILLING_EMAIL=billing@yourdomain.com
FROM_EMAIL=Your Company <noreply@yourdomain.com>
```

### Step 2: Configure Nodemailer (if using)

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}
```

## Email Templates

### Customer Support Auto-Response
```
Subject: We received your message - FableTech Studio

Thank you for contacting FableTech Studio support.

We've received your message and will respond within 24-48 hours.

For urgent matters related to:
- Billing issues: billing@fabletech.studio
- Technical problems: Include your account email and description

Best regards,
FableTech Studio Support Team
```

### Welcome Email
```
Subject: Welcome to FableTech Studio!

Welcome to FableTech Studio!

Your account has been created successfully. You can now access our premium audiobook collection.

Get started: https://fabletech.studio/dashboard

Need help? Contact us at support@yourdomain.com

Happy listening!
The FableTech Studio Team
```

## Email Signatures

### Support Team Signature
```
Best regards,

[Your Name]
Customer Support
FableTech Studio

📧 support@yourdomain.com
🌐 https://fabletech.studio
📱 Premium Audiobook Platform
```

### Admin Signature
```
[Your Name]
Platform Administrator
FableTech Studio

📧 admin@yourdomain.com
🌐 https://fabletech.studio
```

## Monitoring and Management

### Email Analytics
- Monitor delivery rates
- Track open rates for transactional emails
- Check spam scores regularly

### Backup Strategy
- Enable IONOS email backup (if available)
- Forward important emails to backup address
- Regular export of email data

### Security Best Practices
- Use strong, unique passwords
- Enable 2FA on IONOS account
- Regular password updates (every 90 days)
- Monitor for suspicious activity

## Testing Checklist

- [ ] All email accounts created
- [ ] Can send/receive from each address
- [ ] Forwarding rules working
- [ ] SPF record verified
- [ ] Email client configuration tested
- [ ] Application can send emails
- [ ] Auto-responses configured
- [ ] Signatures added to all accounts

## Support Contact

IONOS Email Support:
- Phone: 1-866-991-2631
- Online: IONOS Control Panel → Support

---

Setup Date: ___________
Configured By: ___________
Last Updated: ___________