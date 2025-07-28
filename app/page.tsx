'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from "next/link";
import { TrendingUp, Film, Music, Radio, Sparkles, ArrowRight, Headphones, Crown, Star } from "lucide-react";
import CustomerHeader from "@/components/CustomerHeader";
import HomepageBanner from "@/components/HomepageBanner";
import PremiumLogo from "@/components/PremiumLogo";
import MobileNav from "@/components/MobileNav";
import { 
  fadeInUp, 
  navAnimation, 
  staggerContainer, 
  staggerItem,
  cardHover,
  buttonAnimation
} from "@/lib/animations";

export default function Home() {
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true, amount: 0.3 });

  // Parallax effect for hero
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

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
      icon: Crown,
      title: "Premium",
      description: "Unlock exclusive content with our credit system",
      color: "text-yellow-500",
      bgGradient: "from-yellow-900/20 to-yellow-600/10",
      hoverGradient: "from-yellow-900/30 to-yellow-600/20",
      stats: "VIP Access",
      link: "/credits/purchase"
    }
  ];

  return (
    <motion.div 
      className="min-h-screen bg-black text-white overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <motion.header 
        className="hidden md:block border-b border-gray-800 sticky top-0 z-50 bg-black/90 backdrop-blur-sm"
        variants={navAnimation}
        initial="initial"
        animate="animate"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <PremiumLogo size="md" />
            
            <motion.div 
              className="flex items-center space-x-4 lg:space-x-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/browse" 
                  className="hover:text-gray-300 text-sm lg:text-base font-medium transition-colors"
                >
                  Browse
                </Link>
              </motion.div>
              <CustomerHeader />
            </motion.div>
          </div>
        </nav>
      </motion.header>

      <main className="pt-16 md:pt-0">
        {/* Hero Section with Parallax */}
        <motion.div 
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative"
        >
          <HomepageBanner />
        </motion.div>

        {/* Featured Content Section */}
        <motion.section 
          ref={featuresRef}
          className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          variants={staggerContainer}
        >
          <motion.h3 
            className="text-xl lg:text-2xl font-bold font-poppins mb-6 lg:mb-8 flex items-center gap-2"
            variants={fadeInUp}
          >
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" /> 
            Featured Content
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                custom={index}
                className="group"
              >
                <Link href={feature.link}>
                  <motion.div 
                    className={`relative overflow-hidden bg-gradient-to-br ${feature.bgGradient} border border-gray-800 rounded-xl p-6 lg:p-8 transition-all cursor-pointer h-full`}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated background gradient */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${feature.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    
                    {/* Floating icon animation */}
                    <motion.div
                      className="relative mb-4"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut"
                      }}
                    >
                      <div className={`relative inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm`}>
                        <feature.icon className={`w-8 h-8 lg:w-10 lg:h-10 ${feature.color}`} />
                        {/* Pulse effect */}
                        <motion.div 
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${feature.bgGradient}`}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3
                          }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h4 className="text-xl lg:text-2xl font-bold font-poppins mb-2">{feature.title}</h4>
                      <p className="text-gray-300 text-sm lg:text-base mb-4">{feature.description}</p>
                      
                      {/* Stats badge */}
                      <motion.div 
                        className="inline-flex items-center gap-2 text-xs lg:text-sm font-semibold text-gray-400 bg-black/30 px-3 py-1 rounded-full"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Star className="w-3 h-3" />
                        {feature.stats}
                      </motion.div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <motion.div 
                      className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <ArrowRight className={`w-5 h-5 ${feature.color}`} />
                    </motion.div>
                    
                    {/* Shimmer effect on hover */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{
                        x: "100%",
                        transition: { duration: 0.8, ease: "easeInOut" }
                      }}
                    >
                      <div className="h-full w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    </motion.div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.div
              variants={buttonAnimation}
              whileHover="hover"
              whileTap="tap"
              className="inline-block"
            >
              <Link 
                href="/browse"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold font-poppins transition-all shadow-lg hover:shadow-xl"
              >
                Start Exploring
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Additional animated sections can be added here */}
      </main>

      {/* Footer with fade in */}
      <motion.footer 
        className="border-t border-gray-800 mt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400 font-medium">
            © 2024 FableTech Studios. All rights reserved.
          </p>
        </div>
      </motion.footer>
    </motion.div>
  );
}