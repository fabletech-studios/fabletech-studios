'use client';

import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import Link from 'next/link';

export default function AuthCheckPage() {
  const { user, customer, loading } = useFirebaseCustomerAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Checking Authentication...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Status</h1>
      
      <div className="space-y-4 bg-gray-900 rounded-lg p-6">
        <div>
          <span className="font-semibold">Firebase User:</span> {user ? '✅ Logged In' : '❌ Not Logged In'}
        </div>
        
        {user && (
          <div>
            <span className="font-semibold">User Email:</span> {user.email}
          </div>
        )}
        
        <div>
          <span className="font-semibold">Customer Data:</span> {customer ? '✅ Loaded' : '❌ Not Loaded'}
        </div>
        
        {customer && (
          <>
            <div>
              <span className="font-semibold">Customer Name:</span> {customer.name}
            </div>
            <div>
              <span className="font-semibold">Credits:</span> {customer.credits}
            </div>
          </>
        )}
        
        <div>
          <span className="font-semibold">Customer Token:</span> {localStorage.getItem('customerToken') ? '✅ Present' : '❌ Missing'}
        </div>
      </div>
      
      <div className="mt-8 space-x-4">
        {!user && (
          <Link href="/login" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg inline-block">
            Go to Login
          </Link>
        )}
        
        {user && (
          <>
            <Link href="/credits/purchase" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg inline-block">
              Go to Purchase Credits
            </Link>
            <Link href="/browse" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg inline-block">
              Browse Content
            </Link>
          </>
        )}
      </div>
    </div>
  );
}