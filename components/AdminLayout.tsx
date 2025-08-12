'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/manage', label: 'Dashboard', icon: '📊' },
    { href: '/manage/settings', label: 'Settings', icon: '⚙️' },
    { href: '/manage/promotions', label: 'Promotions', icon: '📧' },
    { href: '/manage/analytics', label: 'Analytics', icon: '📈' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 shadow-xl h-screen sticky top-0 border-r border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-white">Admin Panel</h2>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}