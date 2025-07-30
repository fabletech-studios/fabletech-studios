import Stripe from 'stripe';

// Server-side Stripe instance
// Only initialize if we have the secret key
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

// Log initialization status
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not found in environment variables');
} else {
  console.log('[Stripe] Initialized successfully');
}

// Credit package configuration
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 50,
    price: 499, // $4.99 in cents
    priceDisplay: '$4.99',
    popular: false,
    description: 'Perfect for trying out our audiobooks',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 100,
    price: 999, // $9.99 in cents
    priceDisplay: '$9.99',
    popular: true,
    description: 'Our most popular package',
    savings: 'Save 10%',
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 200,
    price: 1999, // $19.99 in cents
    priceDisplay: '$19.99',
    popular: false,
    description: 'Best value for avid listeners',
    savings: 'Save 20%',
  },
];

// Stripe product metadata
export const STRIPE_METADATA = {
  type: 'credit_purchase',
  platform: 'fabletech_studios',
};