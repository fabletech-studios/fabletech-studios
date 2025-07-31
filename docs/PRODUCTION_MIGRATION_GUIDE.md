# FableTech Studios Production Migration Guide

## Overview
This guide covers the complete migration process from development to production, including custom domain setup with IONOS and Stripe live mode integration.

## Table of Contents
1. [IONOS Domain Integration](#ionos-domain-integration)
2. [Vercel Configuration](#vercel-configuration)
3. [Environment Variables Update](#environment-variables-update)
4. [Stripe Live Mode Migration](#stripe-live-mode-migration)
5. [Production Security](#production-security)
6. [Testing Procedures](#testing-procedures)
7. [Monitoring & Analytics](#monitoring-analytics)

---

## IONOS Domain Integration

### Step 1: Access IONOS Domain Control Panel
1. Log into your IONOS account
2. Navigate to "Domains & SSL" → "Domains"
3. Select your domain (e.g., fabletechstudios.com)
4. Click "DNS Settings" or "Manage DNS"

### Step 2: Configure DNS Records for Vercel

#### A Records (for apex domain)
Add the following A records for your root domain:
```
Type: A
Host: @ (or leave empty for root)
Points to: 76.76.21.21
TTL: 3600
```

#### CNAME Record (for www subdomain)
```
Type: CNAME
Host: www
Points to: cname.vercel-dns.com
TTL: 3600
```

#### Optional: Wildcard for Subdomains
```
Type: CNAME
Host: *
Points to: cname.vercel-dns.com
TTL: 3600
```

### Step 3: IONOS DNS Propagation
- DNS changes typically take 1-48 hours to propagate
- You can check propagation status at: https://dnschecker.org

---

## Vercel Configuration

### Step 1: Add Custom Domain to Vercel

1. Go to your Vercel dashboard
2. Select the "fabletech-studios" project
3. Navigate to "Settings" → "Domains"
4. Click "Add Domain"
5. Enter your domain: `fabletechstudios.com`
6. Click "Add"

### Step 2: Domain Verification

Vercel will automatically:
- Detect your DNS configuration
- Issue SSL certificates via Let's Encrypt
- Set up automatic HTTPS redirection

### Step 3: Configure Domain Redirects

In your Vercel project settings:
1. Set primary domain (e.g., `fabletechstudios.com`)
2. Configure redirects:
   - `www.fabletechstudios.com` → `fabletechstudios.com` (301)
   - `fabletech-studios.vercel.app` → `fabletechstudios.com` (301)

### Step 4: Update Vercel Configuration File

Create/update `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "value": "www.fabletechstudios.com"
        }
      ],
      "destination": "https://fabletechstudios.com/$1",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Environment Variables Update

### Step 1: Update Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://fabletechstudios.com
NEXTAUTH_URL=https://fabletechstudios.com

# Update webhook URLs
STRIPE_WEBHOOK_SECRET=[New webhook secret for custom domain]

# Keep existing (no change needed)
NEXT_PUBLIC_FIREBASE_API_KEY=[existing]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[existing]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[existing]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[existing]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[existing]
NEXT_PUBLIC_FIREBASE_APP_ID=[existing]
```

### Step 2: Update Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `fabletechstudios.com`
   - `www.fabletechstudios.com`

### Step 3: Update Google OAuth Redirect URIs

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://fabletechstudios.com/api/auth/callback/google`
   - `https://www.fabletechstudios.com/api/auth/callback/google`

---

## Stripe Live Mode Migration

### Prerequisites Checklist

- [ ] Business verification completed in Stripe Dashboard
- [ ] Bank account connected and verified
- [ ] Tax information submitted
- [ ] Identity verification completed
- [ ] Terms of Service and Privacy Policy updated

### Step 1: Obtain Live API Keys

1. Log into Stripe Dashboard
2. Toggle from "Test mode" to "Live mode"
3. Navigate to Developers → API keys
4. Copy:
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`)

### Step 2: Create Live Webhook Endpoint

1. In Stripe Dashboard (Live mode) → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://fabletechstudios.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the signing secret

### Step 3: Update Environment Variables for Live Mode

```bash
# Stripe Live Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (new webhook secret)

# Keep test keys as fallback (optional)
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_SECRET_KEY=sk_test_...
```

### Step 4: Update Code for Production Mode

Create `lib/stripe/config.ts`:
```typescript
export const isProduction = process.env.NODE_ENV === 'production';

export const stripeConfig = {
  publishableKey: isProduction 
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    : process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY!,
  secretKey: isProduction
    ? process.env.STRIPE_SECRET_KEY!
    : process.env.STRIPE_TEST_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};
```

---

## Production Security

### Update CORS Configuration

Create `app/api/cors-config.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://fabletechstudios.com' 
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

### Firebase Security Rules Update

Update `firebase-storage-rules.txt`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read from production domain
    match /{allPaths=**} {
      allow read: if request.auth != null || 
                     request.headers['origin'] == 'https://fabletechstudios.com';
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
  }
}
```

### Rate Limiting for Live Payments

Create `middleware/rate-limit.ts`:
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
  fireImmediately: true,
});

export async function rateLimit() {
  const remainingRequests = await limiter.removeTokens(1);
  if (remainingRequests < 0) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## Testing Procedures

### Pre-Launch Checklist

#### Domain & SSL
- [ ] Domain resolves to Vercel IP
- [ ] SSL certificate is valid
- [ ] HTTPS redirect works
- [ ] www to non-www redirect works

#### Application Functionality
- [ ] User registration/login works
- [ ] Google OAuth works with new domain
- [ ] Video playback functions correctly
- [ ] Firebase Storage access works

#### Payment Testing (Live Mode)
1. **Small Test Transaction**
   ```
   - Use real credit card
   - Purchase smallest credit package
   - Verify webhook received
   - Check credits added to account
   - Process refund after verification
   ```

2. **Webhook Verification**
   ```bash
   # Test webhook endpoint
   curl -X POST https://fabletechstudios.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -H "Stripe-Signature: [test-signature]" \
     -d '{test-payload}'
   ```

3. **Error Handling**
   - Test declined card
   - Test insufficient funds
   - Verify error messages display correctly

### Production Monitoring Setup

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Monitor Core Web Vitals

2. **Google Analytics 4**
   ```javascript
   // Add to app/layout.tsx
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
     strategy="afterInteractive"
   />
   <Script id="google-analytics" strategy="afterInteractive">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', '${GA_MEASUREMENT_ID}');
     `}
   </Script>
   ```

3. **Error Tracking (Sentry)**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

---

## Customer Communication Templates

### Payment Confirmation Email
```html
Subject: Payment Confirmation - FableTech Studios

Thank you for your purchase!

Order Details:
- Package: [Package Name]
- Credits: [Credit Amount]
- Amount: $[Amount]
- Date: [Date]

Your credits have been added to your account and are ready to use.

If you have any questions, please contact support@fabletechstudios.com

Best regards,
FableTech Studios Team
```

### Welcome Email
```html
Subject: Welcome to FableTech Studios!

Welcome to FableTech Studios!

Your account has been created successfully. You can now:
- Browse our premium audiobook collection
- Use your credits to unlock episodes
- Track your listening progress

Get started: https://fabletechstudios.com/dashboard

Need help? Contact us at support@fabletechstudios.com

Happy listening!
The FableTech Studios Team
```

---

## Post-Migration Checklist

### Week 1 Monitoring
- [ ] Monitor error logs daily
- [ ] Check payment success rate
- [ ] Verify webhook delivery rate
- [ ] Review customer support tickets
- [ ] Monitor site performance

### Updates Required
- [ ] Update marketing materials with new domain
- [ ] Update social media profiles
- [ ] Update email signatures
- [ ] Submit new sitemap to Google Search Console
- [ ] Update any external integrations

### Backup Plan
- Keep test environment active for 30 days
- Document rollback procedure
- Maintain database backups
- Archive test mode transaction data

---

## Support Contact

For technical support during migration:
- Email: support@fabletechstudios.com
- Response time: Within 24 hours
- Emergency contact: [Add phone number]

---

Last Updated: [Current Date]
Migration Status: [ ] Not Started [ ] In Progress [ ] Completed