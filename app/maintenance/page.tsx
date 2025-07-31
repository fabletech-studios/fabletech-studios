'use client';

import { useEffect, useState } from 'react';
import PremiumLogo from '@/components/PremiumLogo';
import { Wrench, Clock, Sparkles } from 'lucide-react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <PremiumLogo size="lg" />
        </div>
        
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Wrench className="w-16 h-16 text-red-600 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-spin" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-4">
            Under Maintenance
          </h1>
          
          <p className="text-gray-400 text-lg mb-8">
            We're making some improvements to bring you a better experience{dots}
          </p>
          
          <div className="bg-black/50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Expected Duration</span>
            </div>
            <p className="text-gray-300">
              We'll be back online soon! Check back in a few hours.
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>Thank you for your patience</p>
            <p className="font-poppins font-semibold text-red-600">
              FableTech Studios Team
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-600">
          <p>Need urgent assistance? Contact: support@fabletech.studio</p>
        </div>
      </div>
    </div>
  );
}