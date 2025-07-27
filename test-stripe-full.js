// Comprehensive Stripe Test Script
require('dotenv').config({ path: '.env.local' });

console.log('\n=== STRIPE CONFIGURATION TEST ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set (' + process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...)' : '✗ Not set');
console.log('   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✓ Set (' + process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...)' : '✗ Not set');
console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Not set');
console.log('   NEXT_PUBLIC_MOCK_STRIPE:', process.env.NEXT_PUBLIC_MOCK_STRIPE || 'Not set (defaults to false)');

// 2. Test Stripe connection
if (process.env.STRIPE_SECRET_KEY) {
  console.log('\n2. Testing Stripe Connection:');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // Test API connection
  stripe.customers.list({ limit: 1 })
    .then(customers => {
      console.log('   ✓ Successfully connected to Stripe API');
      console.log('   ✓ API Mode:', process.env.STRIPE_SECRET_KEY.includes('sk_test_') ? 'TEST MODE' : 'LIVE MODE');
      
      // Create a test product and price
      console.log('\n3. Creating Test Product and Price:');
      return stripe.products.create({
        name: 'Test Credit Package',
        description: 'Test package for 100 credits',
      });
    })
    .then(product => {
      console.log('   ✓ Created test product:', product.id);
      
      return stripe.prices.create({
        product: product.id,
        unit_amount: 999, // $9.99
        currency: 'usd',
      });
    })
    .then(price => {
      console.log('   ✓ Created test price:', price.id, '($9.99)');
      
      // Create a test checkout session
      console.log('\n4. Creating Test Checkout Session:');
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3001/credits/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3001/credits/purchase',
        metadata: {
          packageId: 'test-package',
          credits: '100',
        },
      });
    })
    .then(session => {
      console.log('   ✓ Created test checkout session:', session.id);
      console.log('   ✓ Checkout URL:', session.url);
      console.log('\n5. Stripe Setup Summary:');
      console.log('   ✓ All Stripe components are working correctly!');
      console.log('   ✓ You can use this checkout URL to test a payment:', session.url);
      console.log('\n=== TEST COMPLETE ===\n');
    })
    .catch(error => {
      console.error('   ✗ Stripe API Error:', error.message);
      console.log('\nTroubleshooting:');
      if (error.message.includes('Invalid API Key')) {
        console.log('   - Your API key is invalid. Please check your Stripe dashboard.');
        console.log('   - Make sure you\'re using the correct key (test vs live).');
      } else if (error.message.includes('network')) {
        console.log('   - Network error. Check your internet connection.');
        console.log('   - If you\'re behind a firewall, you may need to use mock mode.');
      }
    });
} else {
  console.log('\n✗ STRIPE_SECRET_KEY not found!');
  console.log('\nTo fix this:');
  console.log('1. Go to https://dashboard.stripe.com/test/apikeys');
  console.log('2. Copy your test secret key (starts with sk_test_)');
  console.log('3. Add it to your .env.local file:');
  console.log('   STRIPE_SECRET_KEY=sk_test_your_key_here');
}

// 6. Check for common issues
console.log('\n6. Common Issues Check:');
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('pk_')) {
  console.log('   ⚠️  WARNING: You\'re using a publishable key as secret key!');
}
if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('sk_')) {
  console.log('   ⚠️  WARNING: You\'re using a secret key as publishable key!');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.log('   ⚠️  INFO: Webhook secret not set. You\'ll need this for production.');
}
