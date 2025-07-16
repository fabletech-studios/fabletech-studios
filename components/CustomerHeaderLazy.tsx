'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

// Lazy load the full CustomerHeader
const CustomerHeader = dynamic(() => import('./CustomerHeader'), {
  ssr: false,
  loading: () => <CustomerHeaderFallback />
});

// Fallback UI while loading
function CustomerHeaderFallback() {
  return (
    <div className="flex items-center gap-3">
      <Link 
        href="/signup" 
        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
      >
        Sign Up
      </Link>
      <Link 
        href="/login" 
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Link>
    </div>
  );
}

// Wrapper component with error boundary
export default function CustomerHeaderLazy() {
  return (
    <Suspense fallback={<CustomerHeaderFallback />}>
      <CustomerHeader />
    </Suspense>
  );
}