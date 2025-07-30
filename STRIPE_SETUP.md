# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for FableTech Studios on Vercel.

## Prerequisites
- Stripe account (create one at https://stripe.com)
- Access to Vercel dashboard
- Admin access to your deployed application

## Step 1: Get Your Stripe API Keys

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com

2. **Get API Keys**:
   - Go to **Developers → API keys**
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
   
   ⚠️ **Important**: Use test keys for development, live keys for production

## Step 2: Create Webhook Endpoint

1. **In Stripe Dashboard**:
   - Go to **Developers → Webhooks**
   - Click **"Add endpoint"**
   - Enter endpoint URL: `https://fabletech-studios.vercel.app/api/stripe/webhook`
   - Select events to listen to:
     - `checkout.session.completed` (Required)
     - `payment_intent.payment_failed` (Optional, for tracking)
   
2. **Copy Webhook Secret**:
   - After creating the endpoint, click on it
   - Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com

2. **Navigate to Your Project Settings**:
   - Select your FableTech Studios project
   - Go to **Settings → Environment Variables**

3. **Add These Variables**:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_APP_URL=https://fabletech-studios.vercel.app
   ```

4. **Important Settings**:
   - Make sure variables are added for **Production** environment
   - Check "Automatically expose System Environment Variables"

## Step 4: Deploy Changes

1. **Trigger Redeployment**:
   - Go to **Deployments** tab in Vercel
   - Click **"Redeploy"** on the latest deployment
   - Select **"Redeploy with existing Build Cache"**

2. **Wait for Deployment**:
   - Takes 1-2 minutes typically
   - Check build logs for any errors

## Step 5: Test the Integration

1. **Test Purchase Flow**:
   - Go to https://fabletech-studios.vercel.app
   - Log in as a customer
   - Navigate to Credits → Purchase Credits
   - Select a package (50, 100, or 200 credits)
   - Complete checkout with Stripe test card: `4242 4242 4242 4242`
   - Use any future date for expiry, any 3 digits for CVC

2. **Verify Success**:
   - After payment, you should be redirected to success page
   - Check user's credit balance is updated
   - Check Stripe Dashboard for the payment

## Test Card Numbers

For testing, use these Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

## Troubleshooting

### Error: "Payment system not configured"
- Ensure all Stripe environment variables are set in Vercel
- Redeploy after adding variables

### Error: "Invalid URL"
- Make sure `NEXT_PUBLIC_APP_URL` is set to your full domain
- Include `https://` in the URL

### Webhook Not Working
- Verify webhook endpoint URL is exactly: `/api/stripe/webhook`
- Check webhook signing secret is correct
- Look at Stripe webhook logs for errors

### Credits Not Added After Payment
- Check Vercel Function logs for webhook errors
- Ensure Firebase is properly configured
- Verify user ID is being passed correctly

## Going Live

When ready for production:
1. Switch to live API keys in Stripe
2. Update Vercel environment variables with live keys
3. Update webhook endpoint to use live mode
4. Test with a real card to ensure everything works

## Security Notes
- Never expose your Secret key (sk_) publicly
- Keep webhook endpoint secret (whsec_) secure
- Use HTTPS for all production endpoints
- Enable Stripe's security features (3D Secure, etc.)

## Support
- Stripe Documentation: https://stripe.com/docs
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Check Vercel Function logs for debugging