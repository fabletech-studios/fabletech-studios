'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  Sparkles,
  Shield,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import PremiumLogo from '@/components/PremiumLogo';
import { stripePromise } from '@/lib/stripe-client';
import MobileNav from '@/components/MobileNav';
import MainNavigation from '@/components/MainNavigation';
import CustomerHeader from '@/components/CustomerHeader';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceDisplay: string;
  popular?: boolean;
  description: string;
  savings?: string;
}

function PurchaseCreditsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, loading: authLoading } = useFirebaseCustomerAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    
    // Wait for auth to finish loading
    if (authLoading) {
      setLoading(true); // Keep loading state while auth loads
      return;
    }
    
    if (!customer) {
      // Small delay to prevent race conditions
      setTimeout(() => {
        router.push('/login?redirect=/credits/purchase');
      }, 100);
      return;
    }

    // Fetch credit packages
    fetch('/api/credits/packages')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPackages(data.packages);
        }
      })
      .catch(err => {
        console.error('Failed to load packages:', err);
        setError('Failed to load credit packages');
      })
      .finally(() => setLoading(false));
  }, [customer, router, authLoading]);

  const handlePurchase = async (packageId: string) => {
    
    if (!customer) {
      console.error('No customer logged in');
      return;
    }
    
    setPurchasing(packageId);
    setError('');
    
    const token = localStorage.getItem('customerToken');
    if (!token) {
      setError('Please log in to continue');
      setPurchasing(null);
      return;
    }

    try {
      const isMockMode = process.env.NEXT_PUBLIC_MOCK_STRIPE === 'true';
      
      // Use hybrid endpoint when in mock mode to get direct URL
      const endpoint = isMockMode 
        ? '/api/stripe/create-checkout-hybrid' 
        : '/api/stripe/create-checkout-session';
      
      const selectedPackage = packages.find(p => p.id === packageId);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          packageId,
          credits: selectedPackage?.credits,
          amount: selectedPackage?.price,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Check if we have a direct URL (hybrid mode)
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Traditional Stripe.js redirect
        const stripe = await stripePromise;
        
        if (!stripe) {
          console.error('Stripe failed to load. Check that NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.');
          throw new Error('Payment system not available. Please try again later.');
        }

        
        // Add package info to URL for mock mode
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('package', packageId);
        window.history.replaceState({}, '', currentUrl.toString());
        
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Failed to process payment');
      setPurchasing(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <PremiumLogo size="md" />
              <div className="h-6 w-px bg-gray-700" />
              <MainNavigation />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20 md:pt-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Purchase Credits
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400"
          >
            Choose the perfect package for your audiobook journey
          </motion.p>
        </div>

        {/* Canceled Alert */}
        {canceled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-center"
          >
            <p className="text-yellow-400">Payment was canceled. You can try again when you're ready.</p>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded-lg text-center"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Secure Payment</h3>
            <p className="text-sm text-gray-400">Protected by Stripe</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Instant Delivery</h3>
            <p className="text-sm text-gray-400">Credits added immediately</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Never Expire</h3>
            <p className="text-sm text-gray-400">Use credits at your own pace</p>
          </motion.div>
        </div>

        {/* Credit Packages */}
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className={`relative rounded-2xl p-8 border ${
                pkg.popular 
                  ? 'border-red-600 bg-gradient-to-b from-red-900/20 to-transparent' 
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                
                <div className="mb-4">
                  <span className="text-5xl font-bold">{pkg.priceDisplay}</span>
                </div>
                
                <div className="text-3xl font-semibold text-red-500 mb-2">
                  {pkg.credits} Credits
                </div>
                
                {pkg.savings && (
                  <span className="inline-block bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm">
                    {pkg.savings}
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Unlock premium episodes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Support content creators</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>No subscription required</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing !== null}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === pkg.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Purchase Now
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto text-left space-y-4">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold mb-2">How do credits work?</h3>
              <p className="text-gray-400">Each episode costs a certain number of credits to unlock. Once unlocked, you can listen to it unlimited times.</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Do credits expire?</h3>
              <p className="text-gray-400">No! Your credits never expire. Use them at your own pace.</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Is this a subscription?</h3>
              <p className="text-gray-400">No, this is a one-time purchase. Buy credits when you need them.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PurchaseCreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <PurchaseCreditsContent />
    </Suspense>
  );
}