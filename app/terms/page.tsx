'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import MobileNav from '@/components/MobileNav';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <PremiumLogo size="sm" showText={false} />
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/" className="hover:text-gray-300 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20 md:pt-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing or using FableTech Studios ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
            <p className="text-gray-300 mb-4">
              You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use our Service:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
              <li>To transmit any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate FableTech Studios or any other person or entity</li>
              <li>In any way that infringes upon the rights of others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
              You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Credits and Purchases</h2>
            <p className="text-gray-300 mb-4">
              Credits purchased on FableTech Studios are non-refundable and non-transferable. Credits do not expire and can be used 
              to unlock premium content on our platform. All purchases are final.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content</h2>
            <p className="text-gray-300 mb-4">
              All content available on FableTech Studios, including but not limited to audiobooks, videos, images, and text, is 
              protected by copyright and other intellectual property rights. You may not reproduce, distribute, modify, or create 
              derivative works from any content without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Privacy</h2>
            <p className="text-gray-300 mb-4">
              Your use of our Service is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs 
              the Site and informs users of our data collection practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-gray-300 mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
              including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-300">
              Email: support@fabletech.studio
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-center"
            >
              Create Account
            </Link>
            <Link 
              href="/privacy" 
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-center"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}