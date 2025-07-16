'use client';

import Link from 'next/link';
import { User, LogIn, CreditCard, LogOut } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

export default function CustomerHeader() {
  const { customer, loading, logout } = useFirebaseCustomerAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="w-8 h-8 bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="w-16 h-8 bg-gray-800 rounded-lg animate-pulse hidden sm:block"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      {customer ? (
        <>
          {/* Credits Display - Responsive */}
          <div className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 bg-gray-800 rounded-lg">
            <CreditCard className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs lg:text-sm whitespace-nowrap">
              <span className="text-gray-400 hidden sm:inline">Credits:</span>
              <span className="sm:hidden text-gray-400">C:</span>{' '}
              <span className="font-semibold text-white">{customer.credits}</span>
            </span>
          </div>
          
          {/* Buy Credits Button - Responsive */}
          <Link 
            href="/credits/purchase" 
            className="px-2 lg:px-4 py-1.5 lg:py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium text-xs lg:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">Buy Credits</span>
            <span className="sm:hidden">Buy</span>
          </Link>
          
          {/* Profile Link - Responsive */}
          <Link 
            href="/profile" 
            className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1.5 lg:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <User className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="hidden md:inline text-xs lg:text-sm truncate max-w-20 lg:max-w-none">
              {customer.name}
            </span>
          </Link>
          
          {/* Logout Button - Responsive */}
          <button
            onClick={logout}
            className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="hidden lg:inline text-xs lg:text-sm">
              Sign Out
            </span>
          </button>
        </>
      ) : (
        <>
          {/* Sign Up Link - Hidden on very small screens */}
          <Link 
            href="/signup" 
            className="hidden sm:block px-3 lg:px-4 py-1.5 lg:py-2 text-gray-300 hover:text-white transition-colors text-xs lg:text-sm"
          >
            Sign Up
          </Link>
          
          {/* Sign In Button - Always visible */}
          <Link 
            href="/login" 
            className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogIn className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="text-xs lg:text-sm">Sign In</span>
          </Link>
        </>
      )}
    </div>
  );
}