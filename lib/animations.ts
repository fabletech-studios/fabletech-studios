import { Variants } from 'framer-motion';

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Scale animations
export const scaleIn: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 }
};

// Slide animations
export const slideInLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 }
};

export const slideInRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 }
};

// Hero banner animation
export const heroAnimation: Variants = {
  initial: { scale: 1.1, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

// Navigation animation
export const navAnimation: Variants = {
  initial: { y: -100 },
  animate: { 
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

// Ken Burns effect for images
export const kenBurns: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: 1.1,
    transition: {
      duration: 20,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'reverse'
    }
  }
};

// Card hover animations
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 10px 30px -15px rgba(0, 0, 0, 0.3)'
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Button animations
export const buttonAnimation = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

// Magnetic hover effect
export const magneticHover = {
  rest: { x: 0, y: 0 },
  hover: {
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 250,
      damping: 20
    }
  }
};

// Loading shimmer
export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear'
    }
  }
};

// Number counter animation
export const counterAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Success animation
export const successAnimation: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

// Ripple effect
export const ripple: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: 2,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

// Transition presets
export const transitions = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30
  },
  smooth: {
    duration: 0.6,
    ease: [0.43, 0.13, 0.23, 0.96]
  },
  quick: {
    duration: 0.3,
    ease: 'easeOut'
  }
};