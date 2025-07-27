# Stripe API Key Setup Guide - Step by Step

## Step 1: Access Your Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Log in with your Stripe account credentials
3. You should see your Stripe Dashboard home page

## Step 2: Find Your API Keys

### Navigate to API Keys Section:
1. Look at the left sidebar in your Stripe Dashboard
2. Click on **"Developers"** (it has a code icon `</>`)
3. In the dropdown, click on **"API keys"**

### You'll See Two Modes:
- **Test mode** (Toggle in top-right should show "Test mode")
- **Live mode** (We'll use Test mode first)

⚠️ **IMPORTANT**: Make sure you're in **TEST MODE** (you'll see an orange "TEST MODE" badge)

## Step 3: Copy Your Test Keys

You'll see two types of keys:

### 1. Publishable Key (Safe for client-side)
- Starts with: `pk_test_`
- Example: `pk_test_51ABC...xyz`
- Click the **"Reveal test key"** button
- Copy this entire key

### 2. Secret Key (Server-side only - KEEP PRIVATE!)
- Starts with: `sk_test_`
- Example: `sk_test_51ABC...xyz`
- Click the **"Reveal test key"** button
- Copy this entire key

## Step 4: Update Your .env.local File

Open your `.env.local` file and update these lines:

```env
# Replace these with your actual keys
STRIPE_SECRET_KEY=sk_test_[YOUR_SECRET_KEY_HERE]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR_PUBLISHABLE_KEY_HERE]

# We'll get this webhook secret in the next step
STRIPE_WEBHOOK_SECRET=whsec_[WE_WILL_GET_THIS_NEXT]
```

### Example (with fake keys):
```env
STRIPE_SECRET_KEY=sk_test_51OABCDEfghIJKLMNopqrstUVWXYZ1234567890abcdefghijklmnop
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51OABCDEfghIJKLMNopqrstUVWXYZ1234567890
STRIPE_WEBHOOK_SECRET=whsec_WillGetThisFromWebhookSetup
```

## Step 5: Set Up Webhook Endpoint

### For Local Development (Recommended First):

1. **Install Stripe CLI** (if you haven't already):
   ```bash
   # On macOS
   brew install stripe/stripe-cli/stripe
   
   # On Windows (using scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   
   # On Linux
   # Download from https://github.com/stripe/stripe-cli/releases/latest
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open a browser window - confirm the authentication.

3. **Start Webhook Forwarding**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the Webhook Signing Secret**:
   The CLI will display something like:
   ```
   Ready! Your webhook signing secret is whsec_1234567890abcdef (^C to quit)
   ```
   
   Copy this `whsec_...` value and update your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
   ```

### For Production (Later):

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (click "Reveal")

## Step 6: Verify Your Configuration

Let's create a test script to verify everything is connected:

```bash
# In your project directory, create a test file
touch test-stripe-connection.js
```

Add this content:
```javascript
// test-stripe-connection.js
require('dotenv').config({ path: '.env.local' });

console.log('Checking Stripe Configuration...\n');

// Check if keys are loaded
const checks = {
  'Secret Key': process.env.STRIPE_SECRET_KEY,
  'Publishable Key': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  'Webhook Secret': process.env.STRIPE_WEBHOOK_SECRET,
};

let allGood = true;

Object.entries(checks).forEach(([name, value]) => {
  if (value && value.length > 10) {
    console.log(`✅ ${name}: Configured (${value.substring(0, 20)}...)`);
  } else {
    console.log(`❌ ${name}: Missing or invalid`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n🎉 All Stripe keys are configured!');
} else {
  console.log('\n⚠️  Some keys are missing. Please check your .env.local file.');
}
```

Run it:
```bash
node test-stripe-connection.js
```

## Step 7: Test Your Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **In another terminal, start Stripe webhook listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test the flow**:
   - Go to http://localhost:3000
   - Log in as a customer
   - Navigate to Credits → Purchase Credits
   - Click "Purchase Now" on any package
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC (e.g., 123)
   - Any billing ZIP code

## Troubleshooting

### If keys aren't working:
1. Make sure you're copying the ENTIRE key
2. Check you're in TEST mode in Stripe Dashboard
3. Restart your Next.js server after updating .env.local
4. No spaces or quotes around the keys in .env.local

### If webhooks aren't working:
1. Make sure Stripe CLI is running
2. Check the webhook URL matches exactly
3. Look at Stripe CLI terminal for incoming events
4. Check your app's console for errors

## Quick Checklist

- [ ] Logged into Stripe Dashboard
- [ ] In TEST mode (orange badge visible)
- [ ] Copied publishable key (pk_test_...)
- [ ] Copied secret key (sk_test_...)
- [ ] Updated .env.local with both keys
- [ ] Installed and logged into Stripe CLI
- [ ] Started webhook forwarding
- [ ] Copied webhook secret (whsec_...)
- [ ] Restarted Next.js server
- [ ] Test purchase working

## Security Reminders

🔒 **NEVER**:
- Commit .env.local to Git
- Share your secret key (sk_) publicly
- Use test keys in production
- Hard-code keys in your source code

✅ **ALWAYS**:
- Keep .env.local in .gitignore
- Use environment variables
- Rotate keys if compromised
- Use separate keys for production