'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, CreditCard, LogOut, ArrowLeft, Lock, Film, Calendar, TrendingUp, Activity, Trophy, Eye, EyeOff, Receipt } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { getUserActivities, formatActivityTime, type UserActivity } from '@/lib/firebase/activity-service';
import CustomerHeader from '@/components/CustomerHeader';
import BadgeShowcase from '@/components/badges/BadgeShowcase';
import { useBadgeSidebar } from '@/contexts/BadgeSidebarContext';
import PremiumLogo from '@/components/PremiumLogo';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, logout, loading } = useFirebaseCustomerAuth();
  const { isBadgeSidebarVisible, setBadgeSidebarVisible } = useBadgeSidebar();
  const [stats, setStats] = useState({
    episodesUnlocked: 0,
    creditsSpent: 0,
    lastActivity: null as string | null
  });
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [customer, loading, router]);

  useEffect(() => {
    // Fetch real customer data including stats
    if (customer) {
      const token = localStorage.getItem('customerToken');
      if (token) {
        fetch('/api/customer/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.customer) {
            const customerData = data.customer;
            setStats({
              episodesUnlocked: customerData.stats?.episodesUnlocked || 0,
              creditsSpent: customerData.stats?.creditsSpent || 0,
              lastActivity: customerData.unlockedEpisodes?.[0]?.unlockedAt || customerData.createdAt
            });
          }
        })
        .catch(err => console.error('Failed to fetch stats:', err));
        
        // Fetch user activities
        getUserActivities(customer.uid).then(userActivities => {
          setActivities(userActivities);
        });
        
        // Fetch purchase history
        fetch('/api/customer/purchases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPurchases(data.purchases);
          }
        })
        .catch(err => console.error('Failed to fetch purchases:', err));
      }
    }
  }, [customer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <PremiumLogo size="md" />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-red-900/20 to-gray-900 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{customer.name}</h1>
              <p className="text-gray-400">{customer.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Member since {formatDate(customer.createdAt || new Date().toISOString())}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-red-600">{customer.credits}</p>
              <p className="text-sm text-gray-400 mt-1">credits</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Film className="w-8 h-8 text-red-600" />
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold">{stats.episodesUnlocked}</p>
            <p className="text-sm text-gray-400">Episodes Unlocked</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <Activity className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold">{stats.creditsSpent}</p>
            <p className="text-sm text-gray-400">Credits Spent</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{customer.credits}</p>
            <p className="text-sm text-gray-400">Current Balance</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-green-400">Active</p>
            <p className="text-sm text-gray-400">Account Status</p>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              Account Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Full Name</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Email Address</span>
                <span className="font-medium">{customer.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Customer ID</span>
                <span className="font-mono text-sm">{customer.id}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Join Date</span>
                <span className="font-medium">
                  {formatDate(customer.createdAt || new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link
                href="/credits/purchase"
                className="flex items-center justify-between p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Buy More Credits</p>
                    <p className="text-sm opacity-90">Add credits to unlock episodes</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/browse"
                className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Browse Content</p>
                    <p className="text-sm text-gray-400">Explore audiobooks</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/forgot-password"
                className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-gray-400">Update security settings</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Display Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Show Badge Sidebar</p>
                  <p className="text-sm text-gray-400">Display earned badges on the right side of the screen</p>
                </div>
              </div>
              <button
                onClick={() => setBadgeSidebarVisible(!isBadgeSidebarVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isBadgeSidebarVisible ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isBadgeSidebarVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white">
                        {(() => {
                          // Fix credit purchase descriptions with wrong amount format
                          if (activity.type === 'credits_purchased' && activity.metadata?.creditsAmount) {
                            const credits = activity.metadata.creditsPurchased || 0;
                            const amount = activity.metadata.creditsAmount;
                            return `Purchased ${credits} credits for $${(amount / 100).toFixed(2)}`;
                          }
                          return activity.description;
                        })()}
                      </p>
                      {activity.metadata?.episodeTitle && (
                        <p className="text-sm text-gray-400 mt-1">"{activity.metadata.episodeTitle}"</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {formatActivityTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <Link href="/browse" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">
                Start exploring content →
              </Link>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              Purchase History
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/profile/purchases"
                className="text-sm text-red-500 hover:text-red-400 transition-colors font-medium"
              >
                View Full History →
              </Link>
              <button
                onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {showPurchaseHistory ? 'Hide' : 'Show'} Recent
              </button>
            </div>
          </div>
          
          {showPurchaseHistory && (
            <div className="space-y-3">
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {purchase.credits} Credits
                        </p>
                        <p className="text-sm text-gray-400">
                          Package: {purchase.packageId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400">
                          ${(purchase.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No purchase history yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Badge Showcase */}
        <div className="mt-8">
          <BadgeShowcase userId={customer.uid} userStats={stats} />
        </div>
      </main>
    </div>
  );
}