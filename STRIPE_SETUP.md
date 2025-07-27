# Stripe Payment Integration Setup Guide

## Overview
This guide will help you set up Stripe payment processing for FableTech Studios' credit purchase system.

## Prerequisites
- A Stripe account (create one at https://stripe.com)
- Access to your Stripe Dashboard

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Test mode** keys:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### 2. Update Environment Variables

Update your `.env.local` file with your Stripe keys:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 3. Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL:
   - For local testing: Use ngrok or similar tunnel service
   - For production: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add it to `STRIPE_WEBHOOK_SECRET`

### 4. Testing Locally with Stripe CLI

For local development, use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret shown in the terminal
```

### 5. Test Credit Cards

Use these test cards in **test mode**:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future date for expiry and any 3 digits for CVC.

## Credit Packages

The system includes three credit packages:

1. **Starter Pack**: 50 credits for $4.99
2. **Popular Pack**: 100 credits for $9.99 (marked as most popular)
3. **Premium Pack**: 200 credits for $19.99 (best value)

## Payment Flow

1. User clicks "Purchase Now" on a credit package
2. System creates a Stripe Checkout Session
3. User is redirected to Stripe's hosted checkout page
4. After payment, user returns to success page
5. Webhook confirms payment and adds credits to user account

## Going Live

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Copy your live API keys
3. Update environment variables with live keys
4. Update webhook endpoint to production URL
5. Test with a real card (small amount)

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Validate webhook signatures to prevent fraud
- Monitor your Stripe Dashboard for suspicious activity

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test your integration: https://stripe.com/docs/testing