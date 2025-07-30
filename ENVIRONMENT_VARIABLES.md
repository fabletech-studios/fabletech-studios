# Environment Variables Documentation

This document lists all environment variables required for FableTech Studios.

## Required Environment Variables

### Firebase Configuration
```bash
# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Required for secure server-side operations)
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Stripe Configuration
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### NextAuth Configuration
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### Admin Configuration
```bash
# Admin Authentication
ADMIN_EMAIL=admin@fabletech.com
ADMIN_PASSWORD=secure-admin-password

# Migration Key (Must be changed from default!)
ADMIN_MIGRATION_KEY=generate-secure-random-key
```

### Application Configuration
```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# CORS Configuration (comma-separated list)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, unique values for all secrets**
3. **Rotate keys regularly**
4. **Use different keys for development and production**
5. **Store production secrets in Vercel Environment Variables**

## Generating Secure Values

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Generate ADMIN_MIGRATION_KEY
```bash
openssl rand -hex 32
```

### Generate ADMIN_PASSWORD
Use a password manager to generate a strong password with:
- At least 16 characters
- Mixed case letters
- Numbers
- Special characters

## Vercel Deployment

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable listed above
4. Ensure sensitive variables are marked as "Sensitive"
5. Different values can be set for Production, Preview, and Development

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in all required values
3. Never commit `.env.local` to version control

## Troubleshooting

### Firebase Admin SDK
- Ensure FIREBASE_PRIVATE_KEY preserves line breaks (`\n`)
- In Vercel, paste the entire private key including header/footer

### Stripe Webhooks
- Use Stripe CLI for local webhook testing
- Production webhook secret comes from Stripe Dashboard

### CORS Issues
- Add your domain to ALLOWED_ORIGINS
- Include both www and non-www versions if applicable