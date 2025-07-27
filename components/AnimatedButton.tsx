'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, MouseEvent, useRef, useState } from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  ripple?: boolean;
  magnetic?: boolean;
  className?: string;
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  ripple = true,
  magnetic = true,
  className = '',
  onClick,
  ...props
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white'
  };

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const offsetX = (e.clientX - centerX) * 0.2;
    const offsetY = (e.clientY - centerY) * 0.2;
    
    setMagneticOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden font-semibold rounded-lg transition-all
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${className}
      `}
      style={{
        x: magneticOffset.x,
        y: magneticOffset.y,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20
      }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(({ x, y, id }) => (
        <motion.span
          key={id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: x,
            top: y,
            width: 10,
            height: 10,
            x: '-50%',
            y: '-50%',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 8, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
      
      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}