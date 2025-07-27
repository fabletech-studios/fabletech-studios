// Mock Stripe client for development when Stripe.js is blocked
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe Mock Mode - Using mock implementation');

// Create a mock Stripe promise for development
export const stripePromise = new Promise((resolve) => {
  resolve({
    redirectToCheckout: async ({ sessionId }: { sessionId: string }) => {
      console.log('Mock Stripe: Would redirect to checkout with session:', sessionId);
      
      // In development, just show an alert and redirect manually
      if (typeof window !== 'undefined') {
        alert(`Mock Mode: In production, this would redirect to Stripe checkout.\n\nSession ID: ${sessionId}\n\nClick OK to simulate successful payment.`);
        
        // Simulate successful payment by redirecting to success page
        window.location.href = '/credits/purchase/success?session_id=mock_' + sessionId;
      }
      
      return { error: null };
    }
  });
});