import { loadStripe, Stripe } from '@stripe/stripe-js';

// Check if we're in mock mode
const isMockMode = process.env.NEXT_PUBLIC_MOCK_STRIPE === 'true';

// Get the publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Stripe configuration loaded

if (!stripePublishableKey && !isMockMode) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Mock Stripe implementation for development
const mockStripe = {
  redirectToCheckout: async ({ sessionId }: { sessionId: string }) => {
    // Mock Stripe: Simulating checkout redirect
    
    // Extract package info from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('package') || 'starter';
    
    // Show a development message
    if (typeof window !== 'undefined') {
      const proceed = confirm(
        '🧪 DEVELOPMENT MODE\n\n' +
        'Stripe.js is blocked on your network.\n' +
        'Click OK to simulate a successful payment.\n' +
        'Click Cancel to simulate a cancelled payment.'
      );
      
      if (proceed) {
        // Simulate successful payment with package info
        window.location.href = `/credits/success?session_id=mock_${sessionId}&package=${packageId}`;
      } else {
        // Simulate cancelled payment
        window.location.href = '/credits/purchase?canceled=true';
      }
    }
    
    return { error: null };
  }
} as unknown as Stripe;

// Load Stripe.js with error handling
let stripePromise: Promise<Stripe | null> | null = null;

if (isMockMode) {
  // Using mock Stripe implementation
  stripePromise = Promise.resolve(mockStripe);
} else if (stripePublishableKey) {
  try {
    stripePromise = loadStripe(stripePublishableKey);
    
    // Test if Stripe loads successfully
    stripePromise.then(stripe => {
      if (!stripe) {
        console.error('Stripe.js failed to load - likely blocked by network/browser');
        // TIP: Set NEXT_PUBLIC_MOCK_STRIPE=true in .env.local to use mock mode
      }
    }).catch(error => {
      console.error('Stripe.js loading error:', error);
      // TIP: Set NEXT_PUBLIC_MOCK_STRIPE=true in .env.local to use mock mode
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    stripePromise = null;
  }
}

export { stripePromise };