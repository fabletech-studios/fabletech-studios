'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Clock } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import MainNavigation from '@/components/MainNavigation';
import CustomerHeader from '@/components/CustomerHeader';
import MobileNav from '@/components/MobileNav';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
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

      <main className="pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Contact Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-400 text-lg">
              We're here to help! Reach out to us with any questions or feedback.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Support */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Email Support</h3>
                  <p className="text-gray-400 text-sm">For general inquiries</p>
                </div>
              </div>
              <a 
                href="mailto:admin@fabletech.studio" 
                className="text-red-600 hover:text-red-500 font-medium"
              >
                admin@fabletech.studio
              </a>
              <p className="text-gray-400 text-sm mt-2">
                We typically respond within 24-48 hours
              </p>
            </div>

            {/* Business Hours */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Business Hours</h3>
                  <p className="text-gray-400 text-sm">When we're available</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-gray-300">Monday - Friday: 9AM - 6PM EST</p>
                <p className="text-gray-300">Saturday - Sunday: 10AM - 4PM EST</p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">FAQ</h3>
                  <p className="text-gray-400 text-sm">Quick answers</p>
                </div>
              </div>
              <Link 
                href="/help" 
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                Visit our Help Center →
              </Link>
              <p className="text-gray-400 text-sm mt-2">
                Find answers to common questions
              </p>
            </div>

            {/* Support */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Author Inquiries</h3>
                  <p className="text-gray-400 text-sm">For content creators</p>
                </div>
              </div>
              <a 
                href="mailto:support@fabletechstudios.com" 
                className="text-green-600 hover:text-green-500 font-medium"
              >
                support@fabletechstudios.com
              </a>
              <p className="text-gray-400 text-sm mt-2">
                For partnership and content submission
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-3">Before You Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Check our Help Center for instant answers to common questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Include your account email when contacting support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>For technical issues, please describe the problem in detail</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}