'use client';

import { useRef, useState, useEffect } from 'react';
import Link from "next/link";
import { 
  TrendingUp, Film, Trophy, Radio, Sparkles, ArrowRight, 
  Headphones, Crown, Star, Heart, BookOpen, Users, Zap,
  Award, Clock, ChevronRight, Flame, Play
} from "lucide-react";
import CustomerHeader from "@/components/CustomerHeader";
import HomepageBanner from "@/components/HomepageBanner";
import PremiumLogo from "@/components/PremiumLogo";
import MobileNav from "@/components/MobileNav";
import MainNavigation from "@/components/MainNavigation";
import { motion } from 'framer-motion';

export default function Home() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const [contestData, setContestData] = useState<any>(null);
  const [loadingContest, setLoadingContest] = useState(true);

  useEffect(() => {
    // Fetch active contest data
    fetch('/api/contests/get-active')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.contests && data.contests.length > 0) {
          setContestData(data.contests[0]);
        }
      })
      .catch(err => console.error('Failed to load contest:', err))
      .finally(() => setLoadingContest(false));
  }, []);

  const features = [
    {
      icon: Film,
      title: "Original Series",
      description: "Exclusive episodic content you won't find anywhere else",
      color: "text-red-600",
      bgGradient: "from-red-900/20 to-red-600/10",
      hoverGradient: "from-red-900/30 to-red-600/20",
      stats: "New Episodes Weekly",
      link: "/browse",
      available: true
    },
    {
      icon: Trophy,
      title: "Writing Contests",
      description: "Compete for prizes and get your story produced",
      color: "text-purple-600",
      bgGradient: "from-purple-900/20 to-purple-600/10",
      hoverGradient: "from-purple-900/30 to-purple-600/20",
      stats: "Win Amazing Prizes",
      link: "/contest",
      available: true,
      special: true
    },
    {
      icon: Headphones,
      title: "Audiobooks",
      description: "Premium narrated stories for immersive listening",
      color: "text-blue-600",
      bgGradient: "from-blue-900/20 to-blue-600/10", 
      hoverGradient: "from-blue-900/30 to-blue-600/20",
      stats: "1000+ Hours",
      link: "/browse",
      available: true
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

        {/* Contest Promotion Section - NEW */}
        {!loadingContest && contestData && contestData.status === 'voting' && (
          <section className="relative overflow-hidden bg-gradient-to-b from-purple-900/20 to-black py-16 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 rounded-full border border-purple-500/30 mb-4">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-sm font-medium text-purple-300">LIVE CONTEST</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {contestData.title}
                  </span>
                </h2>
                
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                  {contestData.description}
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Submit Story Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-xl p-6 border border-purple-500/30"
                >
                  <BookOpen className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Submit Your Story</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Share your creativity and compete for amazing prizes
                  </p>
                  <Link
                    href="/contest/submit"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Submit Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                {/* Vote Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-xl p-6 border border-pink-500/30"
                >
                  <Heart className="w-12 h-12 text-pink-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Vote for Favorites</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Support amazing stories and help choose the winners
                  </p>
                  <Link
                    href="/contest"
                    className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-semibold"
                  >
                    Vote Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                {/* Prizes Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-xl p-6 border border-yellow-500/30"
                >
                  <Trophy className="w-12 h-12 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Win Big Prizes</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Credits, audio production, and revenue sharing await
                  </p>
                  <Link
                    href="/contest"
                    className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold"
                  >
                    View Prizes <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <Link
                  href="/contest"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
                >
                  <Trophy className="w-6 h-6" />
                  Enter Contest Now
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* What We Offer Section - Redesigned */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Experience Premium Entertainment
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Discover original stories, compete in contests, and enjoy exclusive content
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link href={feature.link}>
                    <div className={`relative h-full bg-gradient-to-br ${feature.bgGradient} rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl`}>
                      {feature.special && (
                        <div className="absolute -top-3 right-6">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            HOT
                          </div>
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`w-8 h-8 ${feature.color}`} />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-gray-400 mb-6">{feature.description}</p>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                          <Star className="w-4 h-4" />
                          {feature.stats}
                        </span>
                        
                        <div className={`${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Series Section - NEW */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-950 to-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-red-600" />
                Featured Series
              </h2>
              <Link
                href="/browse"
                className="flex items-center gap-2 text-red-600 hover:text-red-500 font-semibold"
              >
                View All <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <div className="relative bg-gradient-to-r from-red-900/20 to-purple-900/20 rounded-2xl p-8 border border-red-500/20">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full mb-4">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-400">NEW SERIES</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4">Echoes of Tomorrow</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    A thrilling sci-fi adventure that explores the boundaries of time and consciousness.
                  </p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-gray-400" />
                      10 Episodes
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      5h 30m
                    </span>
                    <span className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      4.9 Rating
                    </span>
                  </div>
                  
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                  >
                    <Play className="w-5 h-5" fill="currentColor" />
                    Watch Now
                  </Link>
                </div>
                
                <div className="relative h-64 md:h-80 bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="w-24 h-24 text-gray-700" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                    <p className="text-sm text-gray-400">Preview Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - NEW */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-red-600 mb-2">1000+</div>
                <div className="text-gray-400">Hours of Content</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-400">Active Authors</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-400">Community Members</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-yellow-600 mb-2">4.8★</div>
                <div className="text-gray-400">Average Rating</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join thousands of creators and fans in our growing community
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
                >
                  <Play className="w-6 h-6" />
                  Start Watching
                </Link>
                
                <Link
                  href="/contest"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 border border-gray-700"
                >
                  <Trophy className="w-6 h-6" />
                  Enter Contest
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Content</h3>
              <ul className="space-y-2">
                <li><Link href="/browse" className="text-gray-400 hover:text-white transition-colors">Browse Series</Link></li>
                <li><Link href="/contest" className="text-gray-400 hover:text-white transition-colors">Writing Contest</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/contest/submit" className="text-gray-400 hover:text-white transition-colors">Submit Story</Link></li>
                <li><Link href="/profile" className="text-gray-400 hover:text-white transition-colors">Author Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 FableTech Studios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}