'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  CreditCard, 
  Play, 
  User, 
  Shield, 
  Headphones, 
  Film,
  HelpCircle,
  Mail,
  Lock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import MainNavigation from '@/components/MainNavigation';
import CustomerHeader from '@/components/CustomerHeader';
import MobileNav from '@/components/MobileNav';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    icon: HelpCircle,
    question: 'How do I create an account?',
    answer: 'You can create an account by clicking the "Sign Up" button and either using Google Sign-In for quick registration or filling out the form with your email and password. New users receive 100 free credits!'
  },
  {
    category: 'Getting Started',
    icon: HelpCircle,
    question: 'What are credits and how do they work?',
    answer: 'Credits are our platform currency used to unlock premium episodes. Each episode shows its credit cost, and you can purchase more credits anytime from your profile or when prompted.'
  },
  {
    category: 'Getting Started',
    icon: HelpCircle,
    question: 'Is there free content available?',
    answer: 'Yes! Many series offer free preview episodes so you can sample content before purchasing. Look for episodes marked as "Free" in the browse section.'
  },
  
  // Account & Profile
  {
    category: 'Account & Profile',
    icon: User,
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email. We\'ll send you a secure link to reset your password. The link expires after 1 hour for security.'
  },
  {
    category: 'Account & Profile',
    icon: User,
    question: 'Can I change my email address?',
    answer: 'Yes, you can update your email address in your Profile settings. You\'ll need to verify the new email address before the change takes effect.'
  },
  {
    category: 'Account & Profile',
    icon: User,
    question: 'How do I delete my account?',
    answer: 'You can request account deletion by contacting support at admin@fabletech.studio. Please note that this action is permanent and cannot be undone.'
  },
  
  // Credits & Payments
  {
    category: 'Credits & Payments',
    icon: CreditCard,
    question: 'How do I purchase credits?',
    answer: 'Click "Buy Credits" in the header or navigate to Credits > Purchase. We offer various packages with bonus credits for larger purchases. Payments are processed securely through Stripe.'
  },
  {
    category: 'Credits & Payments',
    icon: CreditCard,
    question: 'Are my payments secure?',
    answer: 'Yes! All payments are processed through Stripe, a leading payment processor. We never store your credit card information on our servers.'
  },
  {
    category: 'Credits & Payments',
    icon: CreditCard,
    question: 'Can I get a refund for unused credits?',
    answer: 'Credits are non-refundable once purchased. However, they never expire and can be used anytime to unlock content.'
  },
  {
    category: 'Credits & Payments',
    icon: CreditCard,
    question: 'Do credits expire?',
    answer: 'No, credits never expire! Once purchased, they remain in your account until you use them.'
  },
  
  // Playback & Content
  {
    category: 'Playback & Content',
    icon: Play,
    question: 'What video quality is available?',
    answer: 'Videos stream in HD quality (up to 1080p) based on your internet connection. The player automatically adjusts quality for smooth playback.'
  },
  {
    category: 'Playback & Content',
    icon: Play,
    question: 'Can I download episodes for offline viewing?',
    answer: 'Currently, offline downloads are not available. All content streams directly from our servers to ensure copyright protection.'
  },
  {
    category: 'Playback & Content',
    icon: Play,
    question: 'Why is my video buffering?',
    answer: 'Buffering usually indicates a slow internet connection. Try closing other tabs, pausing for a moment to let the video load, or switching to audio-only mode for better performance.'
  },
  {
    category: 'Playback & Content',
    icon: Headphones,
    question: 'Can I listen to audio-only versions?',
    answer: 'Yes! Every episode offers both video and audio-only modes. Switch to audio mode using the toggle buttons above the player for a podcast-like experience.'
  },
  
  // Technical Support
  {
    category: 'Technical Support',
    icon: Monitor,
    question: 'Which browsers are supported?',
    answer: 'FableTech works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.'
  },
  {
    category: 'Technical Support',
    icon: Smartphone,
    question: 'Is there a mobile app?',
    answer: 'Our website is fully mobile-responsive and works great on all devices. You can add it to your home screen for an app-like experience.'
  },
  {
    category: 'Technical Support',
    icon: Globe,
    question: 'Is FableTech available in my country?',
    answer: 'FableTech is available worldwide! Content and pricing are the same regardless of your location.'
  },
  
  // Security & Privacy
  {
    category: 'Security & Privacy',
    icon: Shield,
    question: 'How is my data protected?',
    answer: 'We use industry-standard encryption for all data transmission and storage. Your personal information is never shared with third parties without your consent.'
  },
  {
    category: 'Security & Privacy',
    icon: Lock,
    question: 'What is the copyright policy?',
    answer: 'All content on FableTech is protected by copyright. Unauthorized distribution or recording is prohibited and may result in account termination.'
  },
  {
    category: 'Security & Privacy',
    icon: Shield,
    question: 'How do I report inappropriate content?',
    answer: 'If you encounter any inappropriate content, please report it immediately to admin@fabletech.studio with the episode details.'
  }
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Getting Started']);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const categories = [...new Set(faqData.map(item => item.category))];
  
  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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

      <main className="pt-28 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Help Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-gray-400 text-lg">
              Find answers to common questions and learn how to get the most out of FableTech
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Link href="/contact" className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <Mail className="w-6 h-6 text-red-600 mb-2" />
              <p className="font-medium">Contact Support</p>
            </Link>
            <Link href="/credits/purchase" className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <CreditCard className="w-6 h-6 text-yellow-600 mb-2" />
              <p className="font-medium">Buy Credits</p>
            </Link>
            <Link href="/profile" className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <User className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium">My Account</p>
            </Link>
            <Link href="/browse" className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <Film className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium">Browse Content</p>
            </Link>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {categories.map(category => {
              const categoryItems = filteredFAQ.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;
              
              const CategoryIcon = categoryItems[0].icon;
              const isExpanded = expandedCategories.includes(category);

              return (
                <div key={category} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="w-5 h-5 text-red-600" />
                      <h2 className="text-xl font-semibold">{category}</h2>
                      <span className="text-sm text-gray-400">({categoryItems.length})</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-800">
                      {categoryItems.map((item, index) => {
                        const globalIndex = faqData.indexOf(item);
                        const isQuestionExpanded = expandedQuestions.includes(globalIndex);

                        return (
                          <div key={index} className="border-b border-gray-800 last:border-b-0">
                            <button
                              onClick={() => toggleQuestion(globalIndex)}
                              className="w-full px-6 py-4 text-left hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <p className="font-medium pr-4">{item.question}</p>
                                {isQuestionExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                )}
                              </div>
                            </button>
                            
                            {isQuestionExpanded && (
                              <div className="px-6 pb-4">
                                <p className="text-gray-400">{item.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Need Help */}
          <div className="mt-12 bg-gradient-to-r from-red-900/20 to-red-600/10 rounded-lg p-8 border border-red-900/50">
            <h3 className="text-2xl font-semibold mb-4">Still need help?</h3>
            <p className="text-gray-300 mb-6">
              Our support team is here to assist you with any questions or issues not covered in the FAQ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </Link>
              <a 
                href="mailto:admin@fabletech.studio" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                Email Us Directly
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}