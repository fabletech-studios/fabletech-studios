'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PremiumLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

export default function PremiumLogo({ 
  size = 'md', 
  showText = true, 
  href = '/',
  className = ''
}: PremiumLogoProps) {
  const sizes = {
    xs: { container: 24, icon: 12, text: 'text-lg', padding: 6 },
    sm: { container: 32, icon: 16, text: 'text-xl', padding: 8 },
    md: { container: 40, icon: 20, text: 'text-2xl', padding: 10 },
    lg: { container: 56, icon: 28, text: 'text-4xl', padding: 14 }
  };

  const currentSize = sizes[size];

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    tap: { scale: 0.95 }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  };

  const Logo = (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
    >
      {/* 3D Play Button with Perfect Proportions */}
      <motion.div 
        className="relative"
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        style={{ width: currentSize.container, height: currentSize.container }}
      >
        {/* Shadow layer */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-900 rounded-lg blur-md opacity-50"
          style={{ transform: 'translateY(4px)' }}
        />
        
        {/* Main button container */}
        <div 
          className="relative w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-red-700 rounded-lg shadow-xl flex items-center justify-center"
          style={{
            transform: 'perspective(100px) rotateY(-5deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Inner gradient */}
          <div className="absolute inset-[2px] bg-gradient-to-br from-red-500/20 to-transparent rounded-[6px]" />
          
          {/* Perfectly Centered Play Triangle */}
          <svg
            width={currentSize.icon}
            height={currentSize.icon}
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10"
            style={{
              // Slight offset to account for visual center vs mathematical center
              marginLeft: currentSize.icon * 0.08
            }}
          >
            {/* Equilateral triangle path for play button */}
            <path
              d="M8 5.14v13.72c0 .45.54.67.85.35l8.6-8.86a.5.5 0 0 0 0-.7l-8.6-8.86A.5.5 0 0 0 8 5.14Z"
              fill="url(#playGradient)"
              filter="url(#playDropShadow)"
            />
            <defs>
              <linearGradient id="playGradient" x1="8" y1="5" x2="17.5" y2="12">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFE0E0" />
              </linearGradient>
              <filter id="playDropShadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
              </filter>
            </defs>
          </svg>
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent rounded-lg opacity-0 pointer-events-none"
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.8, 1.2, 1.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        </div>
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className={`font-bold ${currentSize.text} font-poppins bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent select-none`}>
            FableTech
            <span className="text-red-500 ml-1">Studios</span>
          </h1>
        </motion.div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {Logo}
      </Link>
    );
  }

  return Logo;
}