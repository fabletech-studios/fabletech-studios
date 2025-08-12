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
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
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
              flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg
              transition-all duration-200 text-sm lg:text-base
              ${active 
                ? 'bg-red-600/20 text-red-500 font-medium' 
                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
      
      {/* Help link - always visible */}
      <Link
        href="/help"
        className="ml-2 flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden xl:inline text-sm">Help</span>
      </Link>
    </nav>
  );
}