'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Film, CreditCard, User, LogOut, LogIn, Heart, Library, HelpCircle, Trophy } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import PremiumLogo from '@/components/PremiumLogo';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { customer, logout } = useFirebaseCustomerAuth();
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="flex flex-col">
          {/* Top Bar with Logo and Menu */}
          <div className="flex items-center justify-between h-16 px-4">
            <PremiumLogo size="sm" />
            
            {customer && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs">
                  <CreditCard className="w-3 h-3 text-gray-400" />
                  <span className="text-white font-semibold">{customer.credits}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Icon Navigation Bar */}
          <div className="flex items-center justify-around px-4 pb-2 border-t border-gray-800 pt-2">
            <Link
              href="/"
              className={`p-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-gray-400 active:bg-gray-800'
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
            
            <Link
              href="/browse"
              className={`p-2 rounded-lg transition-all ${
                isActive('/browse') 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-gray-400 active:bg-gray-800'
              }`}
            >
              <Film className="w-5 h-5" />
            </Link>
            
            <Link
              href="/contest"
              className={`p-2 rounded-lg transition-all ${
                isActive('/contest') 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-gray-400 active:bg-gray-800'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </Link>
            
            {customer && (
              <Link
                href="/favorites"
                className={`p-2 rounded-lg transition-all ${
                  isActive('/favorites') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 active:bg-gray-800'
                }`}
              >
                <Library className="w-5 h-5" />
              </Link>
            )}
            
            {customer && (
              <Link
                href="/profile/purchases"
                className={`p-2 rounded-lg transition-all ${
                  isActive('/profile/purchases') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 active:bg-gray-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </Link>
            )}
            
            {customer ? (
              <Link
                href="/profile"
                className={`p-2 rounded-lg transition-all ${
                  isActive('/profile') && !isActive('/profile/purchases')
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 active:bg-gray-800'
                }`}
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className={`p-2 rounded-lg transition-all ${
                  isActive('/login') 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 active:bg-gray-800'
                }`}
              >
                <LogIn className="w-5 h-5" />
              </Link>
            )}
            
            <Link
              href="/help"
              className={`p-2 rounded-lg transition-all ${
                isActive('/help') 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-gray-500 active:bg-gray-800'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />

          {/* Menu Panel - Adjusted top position for icon bar */}
          <div
            className={`md:hidden fixed right-0 top-28 bottom-0 w-80 max-w-[80vw] bg-gray-900 z-50 overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
              <div className="p-6">
                {customer ? (
                  <>
                    {/* User Info */}
                    <div className="mb-6 pb-6 border-b border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-gray-400">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Credits</span>
                        </div>
                        <span className="font-semibold">{customer.credits}</span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-2">
                      <Link
                        href="/"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span>Home</span>
                      </Link>
                      
                      <Link
                        href="/browse"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Film className="w-5 h-5" />
                        <span>Browse</span>
                      </Link>
                      
                      <Link
                        href="/contest"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Trophy className="w-5 h-5" />
                        <span>Contest</span>
                      </Link>
                      
                      <Link
                        href="/favorites"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span>My Favorites</span>
                      </Link>
                      
                      <Link
                        href="/credits/purchase"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors text-yellow-500"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Buy Credits</span>
                      </Link>
                      
                      <Link
                        href="/profile"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                      </Link>
                    </nav>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <button
                        onClick={() => {
                          logout();
                          closeMenu();
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-800 rounded-lg transition-colors text-red-400"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Navigation */}
                    <nav className="space-y-2">
                      <Link
                        href="/"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span>Home</span>
                      </Link>
                      
                      <Link
                        href="/browse"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Film className="w-5 h-5" />
                        <span>Browse</span>
                      </Link>
                      
                      <Link
                        href="/contest"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Trophy className="w-5 h-5" />
                        <span>Contest</span>
                      </Link>
                    </nav>

                    {/* Auth Actions */}
                    <div className="mt-6 space-y-3">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
                      >
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </Link>
                      
                      <Link
                        href="/signup"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <span>Create Account</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
          </div>
        </>
      )}
    </>
  );
}