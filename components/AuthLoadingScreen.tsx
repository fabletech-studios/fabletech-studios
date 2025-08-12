'use client';

import { useEffect, useState } from 'react';
import PremiumLogo from '@/components/PremiumLogo';

export default function AuthLoadingScreen({ 
  message = "Authenticating...",
  subMessage = "Please wait while we sign you in"
}: {
  message?: string;
  subMessage?: string;
}) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <PremiumLogo size="lg" />
        </div>
        
        {/* Loading animation */}
        <div className="relative mb-8">
          <div className="w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
        </div>
        
        {/* Messages */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {message}{dots}
        </h2>
        <p className="text-gray-400 text-sm">
          {subMessage}
        </p>
        
        {/* Security note */}
        <div className="mt-8 inline-flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Secure authentication powered by Firebase</span>
        </div>
      </div>
    </div>
  );
}