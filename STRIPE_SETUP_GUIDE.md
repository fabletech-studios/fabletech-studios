# Complete Stripe Setup Guide

## Prerequisites
- Stripe account (create one at https://stripe.com)
- Access to Stripe Dashboard

## Step 1: Get Your API Keys

1. **Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Make sure you're in **Test Mode** (toggle in the top right)

2. **Get Your Test API Keys**
   - Go to https://dashboard.stripe.com/test/apikeys
   - You'll see two keys:
     - **Publishable key**: starts with `pk_test_`
     - **Secret key**: starts with `sk_test_` (click "Reveal test key")

3. **Copy Both Keys**
   - Copy the entire key including the prefix

## Step 2: Configure Environment Variables

1. **Open your .env.local file**
   ```bash
   # In your terminal
   code .env.local
   # or
   nano .env.local
   ```

2. **Add/Update these variables**
   ```env
   # Stripe API Keys
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   
   # For development with network restrictions
   NEXT_PUBLIC_MOCK_STRIPE=false
   
   # Webhook secret (we'll set this later)
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

3. **Save the file**

## Step 3: Test Your Configuration

1. **Run the test script**
   ```bash
   node test-stripe-full.js
   ```

2. **Check the output**
   - You should see green checkmarks (✓) for all tests
   - If you see any errors, follow the troubleshooting steps

## Step 4: Set Up Webhooks (for Production)

1. **Go to Webhooks in Stripe Dashboard**
   - https://dashboard.stripe.com/test/webhooks

2. **Add endpoint**
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing: Use ngrok or similar tool

3. **Select events to listen to**
   - `checkout.session.completed`
   - `payment_intent.succeeded`

4. **Get the Webhook Secret**
   - After creating, click on the webhook
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add to your .env.local file

## Step 5: Test a Purchase

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Go to credit purchase page**
   - Navigate to http://localhost:3001/credits/purchase

3. **Test with Stripe test cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future date and any 3-digit CVC

## Troubleshooting

### "Failed to load Stripe.js" Error
- **Cause**: Network blocking Stripe
- **Solution**: Set `NEXT_PUBLIC_MOCK_STRIPE=true` in .env.local

### "Invalid API Key" Error
- **Cause**: Wrong key or wrong mode
- **Solution**: 
  - Ensure you're using test keys (start with `sk_test_` and `pk_test_`)
  - Check you copied the entire key
  - Make sure no extra spaces

### Webhooks Not Working
- **For local testing**: Use ngrok
  ```bash
  ngrok http 3001
  ```
  Then use the ngrok URL for webhook endpoint

### Restart Required
- **After changing .env.local**: Always restart your Next.js server
  ```bash
  # Stop the server (Ctrl+C)
  # Start again
  npm run dev
  ```

## Moving to Production

1. **Get Live API Keys**
   - Switch to Live Mode in Stripe Dashboard
   - Get live keys (start with `sk_live_` and `pk_live_`)

2. **Update Production Environment**
   - Add live keys to your production environment variables
   - Never commit API keys to git

3. **Update Webhook URLs**
   - Create webhook for your production domain
   - Update webhook secret in production

## Security Best Practices

1. **Never expose secret keys**
   - Only use `STRIPE_SECRET_KEY` on server-side
   - `NEXT_PUBLIC_` prefix is for client-side keys only

2. **Use webhook signatures**
   - Always verify webhook signatures in production

3. **Enable Stripe Radar**
   - Go to https://dashboard.stripe.com/settings/radar
   - Enable fraud protection rules

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com
