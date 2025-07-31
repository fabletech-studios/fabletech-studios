// Simplified animations without complex motion values to prevent hydration issues

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const navAnimation = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05 }
};

export const shimmer = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};