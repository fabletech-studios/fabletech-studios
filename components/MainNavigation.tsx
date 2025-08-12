'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Film, 
  Heart, 
  CreditCard, 
  User, 
  HelpCircle,
  BarChart3,
  Library
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

export default function MainNavigation() {
  const pathname = usePathname();
  const { customer } = useFirebaseCustomerAuth();
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home, show: 'always' },
    { href: '/browse', label: 'Browse', icon: Film, show: 'always' },
    { href: '/favorites', label: 'My Library', icon: Library, show: 'auth' },
    { href: '/profile/purchases', label: 'Purchases', icon: CreditCard, show: 'auth' },
    { href: '/profile', label: 'Profile', icon: User, show: 'auth' },
  ];
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };
  
  return (
    <nav className="hidden md:flex items-center gap-2">
      {navItems.map((item) => {
        // Check if item should be shown
        if (item.show === 'auth' && !customer) return null;
        
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative group flex items-center justify-center
              w-10 h-10 rounded-lg transition-all duration-200
              ${active 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible
                          transition-all duration-200 whitespace-nowrap z-50
                          border border-gray-700 shadow-xl">
              {item.label}
              {/* Little arrow pointing up */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 
                            bg-gray-900 border-t border-l border-gray-700 
                            transform rotate-45"></div>
            </div>
          </Link>
        );
      })}
      
      {/* Help link - always visible */}
      <Link
        href="/help"
        className="relative group flex items-center justify-center
                   w-10 h-10 rounded-lg transition-all duration-200
                   text-gray-500 hover:text-gray-200 hover:bg-gray-800"
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
        
        {/* Tooltip */}
        <div className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      border border-gray-700 shadow-xl">
          Help
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 
                        bg-gray-900 border-t border-l border-gray-700 
                        transform rotate-45"></div>
        </div>
      </Link>
    </nav>
  );
}