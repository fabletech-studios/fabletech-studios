'use client';

import { useRef } from 'react';
import Link from "next/link";
import { TrendingUp, Film, Music, Radio, Sparkles, ArrowRight, Headphones, Crown, Star, Heart } from "lucide-react";
import CustomerHeader from "@/components/CustomerHeader";
import HomepageBanner from "@/components/HomepageBanner";
import PremiumLogo from "@/components/PremiumLogo";
import MobileNav from "@/components/MobileNav";
import MainNavigation from "@/components/MainNavigation";

export default function Home() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  const features = [
    {
      icon: Headphones,
      title: "Audiobooks",
      description: "Immerse yourself in captivating stories and adventures",
      color: "text-red-600",
      bgGradient: "from-red-900/20 to-red-600/10",
      hoverGradient: "from-red-900/30 to-red-600/20",
      stats: "1000+ Hours",
      link: "/browse"
    },
    {
      icon: Film,
      title: "Series",
      description: "Follow ongoing narratives with episodic content",
      color: "text-purple-600",
      bgGradient: "from-purple-900/20 to-purple-600/10",
      hoverGradient: "from-purple-900/30 to-purple-600/20",
      stats: "New Episodes Weekly",
      link: "/browse"
    },
    {
      icon: Radio,
      title: "Podcasts",
      description: "Listen to exclusive interviews and discussions",
      color: "text-blue-600",
      bgGradient: "from-blue-900/20 to-blue-600/10", 
      hoverGradient: "from-blue-900/30 to-blue-600/20",
      stats: "Daily Updates",
      link: "/browse"
    },
    {
      icon: Music,
      title: "Music Journeys",
      description: "Experience curated soundscapes and stories",
      color: "text-green-600",
      bgGradient: "from-green-900/20 to-green-600/10",
      hoverGradient: "from-green-900/30 to-green-600/20",
      stats: "Premium Audio",
      link: "/browse"
    },
    {
      icon: Crown,
      title: "Exclusive Content",
      description: "Access premium creator content and early releases",
      color: "text-yellow-600",
      bgGradient: "from-yellow-900/20 to-yellow-600/10",
      hoverGradient: "from-yellow-900/30 to-yellow-600/20",
      stats: "Members Only",
      link: "/browse"
    },
    {
      icon: Sparkles,
      title: "Special Features",
      description: "Behind-the-scenes and bonus content",
      color: "text-pink-600",
      bgGradient: "from-pink-900/20 to-pink-600/10",
      hoverGradient: "from-pink-900/30 to-pink-600/20",
      stats: "Limited Edition",
      link: "/browse"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
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
        {/* Hero Section */}
        <div ref={heroRef} className="relative">
          <HomepageBanner />
        </div>

        {/* Featured Content Section */}
        <section 
          ref={featuresRef}
          className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <h3 className="text-xl lg:text-2xl font-bold font-poppins mb-6 lg:mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" /> 
            Featured Content
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="group">
                <Link href={feature.link}>
                  <div className={`relative overflow-hidden bg-gradient-to-br ${feature.bgGradient} border border-gray-800 rounded-xl p-6 lg:p-8 transition-all cursor-pointer h-full hover:scale-[1.02] hover:shadow-2xl transform duration-200`}>
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    {/* Icon */}
                    <div className="relative mb-4">
                      <div className={`relative inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm`}>
                        <feature.icon className={`w-8 h-8 lg:w-10 lg:h-10 ${feature.color}`} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h4 className="text-xl lg:text-2xl font-bold font-poppins mb-2">{feature.title}</h4>
                      <p className="text-gray-300 text-sm lg:text-base mb-4">{feature.description}</p>
                      
                      {/* Stats badge */}
                      <div className="inline-flex items-center gap-2 text-xs lg:text-sm font-semibold text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                        <Star className="w-3 h-3" />
                        {feature.stats}
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden">
                      <div className="h-full w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link 
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold font-poppins transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Exploring
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-center text-gray-400 font-medium">
              © 2025 FableTech Studios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}