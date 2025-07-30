'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Sparkles, 
  CreditCard,
  ArrowRight,
  Coins
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import PremiumLogo from '@/components/PremiumLogo';
import confetti from 'canvas-confetti';

function PurchaseSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, refreshCustomer, loading: authLoading } = useFirebaseCustomerAuth();
  const [loading, setLoading] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [previousCredits, setPreviousCredits] = useState(0);
  const confettiTriggered = useRef(false);
  const purchaseProcessed = useRef(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }
    
    if (!customer) {
      // Delay redirect to prevent race conditions
      setTimeout(() => {
        router.push('/login');
      }, 100);
      return;
    }

    // Store previous credits for animation
    setPreviousCredits(customer.credits || 0);

    // Trigger confetti animation only after customer is loaded
    if (!confettiTriggered.current && customer) {
      confettiTriggered.current = true;
      triggerConfetti();
    }

    // For mock sessions, process the mock purchase
    if (sessionId?.startsWith('mock_') && !purchaseProcessed.current) {
      // Mark as processed immediately to prevent multiple calls
      purchaseProcessed.current = true;
      
      // In mock mode, we need to manually add credits since webhook won't fire
      processMockPurchase(sessionId);
    } else if (sessionId && !purchaseProcessed.current) {
      // For real Stripe sessions, you might want to verify with backend
      fetchPurchaseDetails();
    } else {
      setLoading(false);
    }
  }, [customer, sessionId, router, refreshCustomer, authLoading]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const processMockPurchase = async (mockSessionId: string) => {
    try {
      // Processing mock purchase
      
      // Get package from URL params
      const packageId = searchParams.get('package') || 'starter';
      
      // Define package details
      const packages: Record<string, { credits: number; amount: number; name: string; display: string }> = {
        starter: { credits: 50, amount: 499, name: 'Starter Pack', display: '$4.99' },
        popular: { credits: 100, amount: 999, name: 'Popular Pack', display: '$9.99' },
        premium: { credits: 200, amount: 1999, name: 'Premium Pack', display: '$19.99' },
      };
      
      const selectedPackage = packages[packageId] || packages.starter;
      
      // Get the original session ID from the API response
      const token = localStorage.getItem('customerToken');
      if (!token) {
        console.error('No token for mock purchase');
        setLoading(false);
        return;
      }

      // For mock mode ONLY, we need to call the purchase API directly
      // since the webhook won't fire. For real Stripe payments, 
      // the webhook handles this to avoid double credits
      const response = await fetch('/api/customer/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: packageId,
          credits: selectedPackage.credits,
          amount: selectedPackage.amount,
          stripeSessionId: mockSessionId,
        }),
      });

      if (response.ok) {
        // Mock purchase processed successfully
        // Refresh customer data to get updated credits
        await refreshCustomer();
        
        setPurchaseDetails({
          credits: selectedPackage.credits,
          package: selectedPackage.name,
          amount: selectedPackage.display
        });
      } else {
        console.error('Failed to process mock purchase');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing mock purchase:', error);
      setLoading(false);
    }
  };

  const fetchPurchaseDetails = async () => {
    try {
      // For real Stripe sessions, we need to verify and process the payment
      const token = localStorage.getItem('customerToken');
      if (!token || !sessionId || sessionId.startsWith('mock_')) {
        await refreshCustomer();
        setLoading(false);
        return;
      }

      // Verify the session with Stripe and process the purchase
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Session verified
        // For real Stripe payments, the webhook handles adding credits
        // We should NOT call purchase-credits API here to avoid double credits
        console.log('[Success Page] Stripe session verified, webhook will handle credits');
      }
      
      // Refresh customer data to show updated credits
      await refreshCustomer();
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const creditsAdded = customer ? (customer.credits - previousCredits) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <PremiumLogo />
            <Link 
              href="/browse"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Continue to Browse
            </Link>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-8"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-xl text-gray-400 mb-12">
            Thank you for your purchase. Your credits have been added to your account.
          </p>

          {/* Credit Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-2xl p-8 mb-12 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold">Credit Summary</h2>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>

            <div className="space-y-4">
              {creditsAdded > 0 && (
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-400">Credits Added:</span>
                  <span className="text-green-500 font-semibold">+{creditsAdded}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-lg border-t border-gray-800 pt-4">
                <span className="text-gray-400">New Balance:</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-500">
                    {customer?.credits || 0}
                  </span>
                </div>
              </div>
            </div>

            {purchaseDetails && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CreditCard className="w-4 h-4" />
                  <span>Order ID: {sessionId}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Listening
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="text-sm text-gray-400">
              Your credits can be used to unlock premium episodes
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 p-6 bg-gray-900/50 rounded-lg max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold mb-3">What's Next?</h3>
            <ul className="text-left space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Browse our collection of premium audiobooks and episodes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use your credits to unlock any episode (except free ones)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your unlocked episodes remain accessible forever</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Track your listening progress and earn achievement badges</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
}