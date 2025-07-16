'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, TrendingUp, Star, Zap } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useRouter } from 'next/navigation';

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 9.99,
    icon: CreditCard,
    description: 'Perfect for trying out our content'
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 300,
    price: 24.99,
    bonus: 50,
    icon: TrendingUp,
    description: 'Most popular choice',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 500,
    price: 39.99,
    bonus: 100,
    icon: Star,
    description: 'Best value for regular viewers'
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    credits: 1000,
    price: 74.99,
    bonus: 250,
    icon: Zap,
    description: 'For the ultimate experience'
  }
];

export default function CreditsPurchasePage() {
  const { customer, updateCredits, refreshCustomer } = useFirebaseCustomerAuth();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async (packageId: string) => {
    if (!customer) {
      router.push('/login');
      return;
    }

    setProcessing(true);
    const selectedPkg = creditPackages.find(p => p.id === packageId);
    
    if (selectedPkg) {
      try {
        // In a real app, this would process payment through a payment gateway
        // For demo, we'll add credits directly through the API
        const totalCredits = selectedPkg.credits + (selectedPkg.bonus || 0);
        
        const response = await fetch('/api/customer/purchase-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('customerToken')}`
          },
          body: JSON.stringify({
            packageId: packageId,
            credits: totalCredits,
            amount: selectedPkg.price
          })
        });

        const result = await response.json();
        
        if (result.success) {
          await refreshCustomer(); // Refresh customer data from Firestore
          alert(`Successfully purchased ${totalCredits} credits!`);
          router.push('/profile');
        } else {
          alert(`Purchase failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Purchase error:', error);
        alert('Purchase failed. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="hover:text-gray-300">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-semibold">Purchase Credits</h1>
            </div>
            {customer && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Current Balance:</span>
                <span className="font-bold text-xl">{customer.credits} credits</span>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Credit Package</h2>
          <p className="text-gray-400 text-lg">Unlock premium episodes and exclusive content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditPackages.map((pkg) => {
            const Icon = pkg.icon;
            const totalCredits = pkg.credits + (pkg.bonus || 0);
            const pricePerCredit = (pkg.price / totalCredits).toFixed(3);
            
            return (
              <div
                key={pkg.id}
                className={`relative rounded-lg p-6 border-2 transition-all ${
                  pkg.popular 
                    ? 'border-red-600 bg-gray-900/50' 
                    : 'border-gray-800 hover:border-gray-700 bg-gray-900/30'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-red-600" />
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-gray-400 text-sm">{pkg.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold mb-1">
                    {pkg.credits} credits
                  </div>
                  {pkg.bonus && (
                    <div className="text-green-500 text-sm font-semibold">
                      +{pkg.bonus} bonus credits
                    </div>
                  )}
                  <div className="text-gray-400 text-sm mt-2">
                    ${pricePerCredit} per credit
                  </div>
                </div>

                <div className="text-center mb-6">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={processing}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    pkg.popular
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } disabled:bg-gray-700 disabled:cursor-not-allowed`}
                >
                  {processing && selectedPackage === pkg.id ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p className="mb-2">
            <span className="font-semibold">Note:</span> This is a demo. No actual payment will be processed.
          </p>
          <p>
            Credits are used to unlock premium episodes. Most episodes cost 30 credits.
          </p>
        </div>
      </main>
    </div>
  );
}