'use client';

import Link from 'next/link';
import CustomerHeader from '@/components/CustomerHeader';
import PremiumLogo from '@/components/PremiumLogo';
import MainNavigation from '@/components/MainNavigation';
import MobileNav from '@/components/MobileNav';

export default function SiteHeader() {
  return (
    <>
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800 sticky top-0 z-50 bg-black/90 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <PremiumLogo size="md" />
              <MainNavigation />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>
    </>
  );
}