# Stripe Live Mode Setup Guide

## 🚀 Switching from Test to Live Payments

### Prerequisites
1. Verify your Stripe account is fully activated
2. Complete any required business verification in Stripe Dashboard
3. Have your bank account connected for payouts

### Step 1: Get Live API Keys from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch from "Test mode" to "Live mode" (toggle in top right)
3. Navigate to Developers → API keys
4. Copy your **Live keys**:
   - `Publishable key` (starts with `pk_live_`)
   - `Secret key` (starts with `sk_live_`)

### Step 2: Update Environment Variables

#### Local Development (.env.local)
```bash
# Comment out or remove test keys
#STRIPE_SECRET_KEY=sk_test_...
#NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Add live keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY

# IMPORTANT: Set mock mode to false
NEXT_PUBLIC_MOCK_STRIPE=false
```

#### Production (Vercel Dashboard)
1. Go to your Vercel project settings
2. Navigate to Settings → Environment Variables
3. Update the following for Production environment:
   - `STRIPE_SECRET_KEY` → Your live secret key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Your live publishable key
   - `NEXT_PUBLIC_MOCK_STRIPE` → `false` (or remove it)
   - `STRIPE_WEBHOOK_SECRET` → (see Step 3)

### Step 3: Setup Live Webhook

1. In Stripe Dashboard (Live mode), go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://www.fabletech.studio/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Vercel with this value

### Step 4: Test Live Payments

Before going fully live:

1. **Create a test purchase with a real card**:
   - Use a small credit package (50 credits)
   - Use your own credit card
   - Verify credits are added to your account
   - Check Stripe Dashboard for the payment

2. **Verify webhook is working**:
   - Check Stripe webhook logs for successful delivery
   - Verify Firebase is updated with purchase

3. **Test refund process** (optional):
   - Issue a refund from Stripe Dashboard
   - Verify it processes correctly

### Step 5: Final Checklist

- [ ] Live keys are in Vercel production environment
- [ ] Mock mode is disabled (`NEXT_PUBLIC_MOCK_STRIPE=false`)
- [ ] Webhook is configured and tested
- [ ] Terms of Service mentions no refund policy
- [ ] Support email is working (support@fabletechstudios.com)
- [ ] You've done at least one successful test purchase

### Step 6: Deploy to Production

```bash
git push origin main
```

Vercel will automatically deploy with the new environment variables.

### Important Security Notes

⚠️ **NEVER commit live keys to Git**
- Always use environment variables
- Live keys should only be in Vercel Dashboard
- Rotate keys immediately if exposed

### Monitoring

After going live:
1. Monitor Stripe Dashboard for payments
2. Check Vercel Functions logs for any errors
3. Set up Stripe email notifications for payments

### Rollback Plan

If issues arise:
1. Set `NEXT_PUBLIC_MOCK_STRIPE=true` in Vercel
2. This will disable real payments immediately
3. Fix issues and test thoroughly before re-enabling

---

## Support Contacts

**Stripe Support**: https://support.stripe.com
**Your Support Email**: support@fabletechstudios.com

Good luck with your launch! 🎉