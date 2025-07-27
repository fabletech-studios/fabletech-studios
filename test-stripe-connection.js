// Test script to verify Stripe configuration
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Stripe Configuration...\n');

// Check if keys are loaded
const checks = {
  'Secret Key': process.env.STRIPE_SECRET_KEY,
  'Publishable Key': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  'Webhook Secret': process.env.STRIPE_WEBHOOK_SECRET,
};

let allGood = true;
let hasWebhook = true;

Object.entries(checks).forEach(([name, value]) => {
  if (value && value.length > 10) {
    // Check if it has the right prefix
    let prefix = '';
    if (name === 'Secret Key' && value.startsWith('sk_test_')) prefix = '✓ Test mode';
    if (name === 'Secret Key' && value.startsWith('sk_live_')) prefix = '⚠️  Live mode';
    if (name === 'Publishable Key' && value.startsWith('pk_test_')) prefix = '✓ Test mode';
    if (name === 'Publishable Key' && value.startsWith('pk_live_')) prefix = '⚠️  Live mode';
    if (name === 'Webhook Secret' && value.startsWith('whsec_')) prefix = '✓ Valid format';
    
    console.log(`✅ ${name}: Configured ${prefix}`);
    console.log(`   Preview: ${value.substring(0, 20)}...${value.substring(value.length - 4)}\n`);
  } else {
    console.log(`❌ ${name}: Missing or invalid\n`);
    allGood = false;
    if (name === 'Webhook Secret') hasWebhook = false;
  }
});

console.log('-----------------------------------\n');

if (allGood) {
  console.log('🎉 All Stripe keys are configured!\n');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. In another terminal: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('3. Test a purchase at http://localhost:3000/credits/purchase');
} else {
  console.log('⚠️  Some keys are missing. Please check your .env.local file.\n');
  
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.log('To get your API keys:');
    console.log('1. Go to https://dashboard.stripe.com');
    console.log('2. Click "Developers" → "API keys"');
    console.log('3. Make sure you\'re in TEST mode (orange badge)');
    console.log('4. Copy both keys and add to .env.local\n');
  }
  
  if (!hasWebhook) {
    console.log('To get webhook secret:');
    console.log('1. Install Stripe CLI: brew install stripe/stripe-cli/stripe');
    console.log('2. Run: stripe login');
    console.log('3. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    console.log('4. Copy the whsec_... value shown\n');
  }
}

// Test connection to Stripe (only if we have a secret key)
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.log('🔌 Testing connection to Stripe...');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  stripe.products.list({ limit: 1 })
    .then(() => {
      console.log('✅ Successfully connected to Stripe API!\n');
    })
    .catch((error) => {
      console.log('❌ Failed to connect to Stripe:', error.message);
      console.log('   Make sure your secret key is correct.\n');
    });
}