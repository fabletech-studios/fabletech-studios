'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, CreditCard, LogOut, ArrowLeft, Lock, Film, 
  Calendar, TrendingUp, Activity, Trophy, Eye, EyeOff, 
  Receipt, BookOpen, Award, Coins, ChevronRight, Star
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { getUserActivities, formatActivityTime, type UserActivity } from '@/lib/firebase/activity-service';
import CustomerHeader from '@/components/CustomerHeader';
import ModernBadgeShowcase from '@/components/badges/ModernBadgeShowcase';
import { useBadgeSidebar } from '@/contexts/BadgeSidebarContext';
import PremiumLogo from '@/components/PremiumLogo';
import MobileNav from '@/components/MobileNav';
import MainNavigation from '@/components/MainNavigation';

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
  const [contestSubmissions, setContestSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
        fetch('/api/customer/me-v2', {
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
        
        // Fetch user activities from API
        fetch('/api/customer/activities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setActivities(data.activities || []);
          }
        })
        .catch(err => {
          console.error('Failed to fetch activities:', err);
          setActivities([]); // Set empty array on error
        });
        
        // Fetch purchase history
        fetch('/api/customer/purchases-v2', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPurchases(data.purchases || []);
          }
        })
        .catch(err => {
          console.error('Failed to fetch purchases:', err);
          setPurchases([]); // Set empty array on error
        });
        
        // Fetch contest submissions
        setLoadingSubmissions(true);
        fetch('/api/contests/author-submissions?userId=' + customer.uid)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setContestSubmissions(data.submissions || []);
          }
        })
        .catch(err => {
          console.error('Failed to fetch contest submissions:', err);
          setContestSubmissions([]);
        })
        .finally(() => setLoadingSubmissions(false));
      }
    }
  }, [customer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const formatDate = (dateString: string | any) => {
    if (!dateString) return 'Recently';
    
    let date: Date;
    
    // Handle Firebase Timestamp objects
    if (dateString && typeof dateString === 'object' && dateString._seconds) {
      date = new Date(dateString._seconds * 1000);
    } 
    // Handle Firebase Timestamp toDate() method
    else if (dateString && typeof dateString === 'object' && typeof dateString.toDate === 'function') {
      date = dateString.toDate();
    }
    // Handle regular date strings/objects
    else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <PremiumLogo size="md" />
              <div className="h-6 w-px bg-gray-700" />
              <MainNavigation />
            </div>
            <CustomerHeader />
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-28 md:pt-8">
        {/* Compact Profile Header */}
        <div className="bg-black/50 backdrop-blur border border-purple-900/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{customer.name}</h1>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{customer.email}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Member since {formatDate(customer.createdAt)}
              </p>
            </div>
            
            {/* Credits */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <span className="text-xl sm:text-2xl font-bold text-white">{customer.credits}</span>
              </div>
              <p className="text-xs text-gray-400">credits</p>
            </div>
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-black/30 backdrop-blur border border-gray-800/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-4 h-4 text-purple-500" />
              <span className="text-lg sm:text-xl font-bold">{stats.episodesUnlocked}</span>
            </div>
            <p className="text-xs text-gray-400">Episodes</p>
          </div>

          <div className="bg-black/30 backdrop-blur border border-gray-800/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-lg sm:text-xl font-bold">{stats.creditsSpent}</span>
            </div>
            <p className="text-xs text-gray-400">Spent</p>
          </div>

          <div className="bg-black/30 backdrop-blur border border-gray-800/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-lg sm:text-xl font-bold">{contestSubmissions.length}</span>
            </div>
            <p className="text-xs text-gray-400">Submissions</p>
          </div>

          <div className="bg-black/30 backdrop-blur border border-gray-800/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-400">Active</span>
            </div>
            <p className="text-xs text-gray-400">Status</p>
          </div>
        </div>

        {/* Quick Actions - Compact Cards */}
        <div className="bg-black/50 backdrop-blur rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/credits/purchase"
              className="flex items-center justify-between p-3 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-700/30 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-sm font-medium">Buy Credits</p>
                  <p className="text-xs text-gray-500">Unlock more content</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              href="/browse"
              className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <Film className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Browse</p>
                  <p className="text-xs text-gray-500">Explore content</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </Link>

            <Link
              href="/forgot-password"
              className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-gray-500">Change password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Contest Submissions - Compact */}
        {contestSubmissions.length > 0 && (
          <div className="bg-black/50 backdrop-blur rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Contest Submissions
              </h2>
              <Link href="/contest/submit" className="text-xs text-purple-400 hover:text-purple-300">
                Submit New →
              </Link>
            </div>
            
            <div className="space-y-2">
              {contestSubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="bg-black/30 rounded-lg p-3 border border-gray-800/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{submission.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {submission.isApproved ? 
                          <span className="text-green-400">Approved</span> : 
                          <span className="text-yellow-400">Pending</span>
                        } • {submission.votes?.total || 0} votes
                      </p>
                    </div>
                    {submission.winner && (
                      <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Compact Timeline */}
        <div className="bg-black/50 backdrop-blur rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400">Recent Activity</h2>
            <Link href="/browse" className="text-xs text-purple-400 hover:text-purple-300">
              Browse →
            </Link>
          </div>
          
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-800/30 last:border-0">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 line-clamp-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formatActivityTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>

        {/* Purchase History - Compact Toggle */}
        <div className="bg-black/50 backdrop-blur rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-green-500" />
              Purchase History
            </h2>
            <button
              onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              {showPurchaseHistory ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showPurchaseHistory && (
            <div className="space-y-2">
              {purchases.length > 0 ? (
                purchases.slice(0, 3).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-gray-800/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{purchase.credits} Credits</p>
                      <p className="text-xs text-gray-500">{formatDate(purchase.createdAt)}</p>
                    </div>
                    <span className="text-sm font-medium text-green-400">
                      ${(purchase.amount / 100).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No purchases yet</p>
              )}
              {purchases.length > 3 && (
                <Link href="/profile/purchases" className="block text-center text-xs text-purple-400 hover:text-purple-300 pt-2">
                  View All ({purchases.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-black/50 backdrop-blur rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Settings</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Badge Sidebar</p>
                  <p className="text-xs text-gray-500">Show earned badges</p>
                </div>
              </div>
              <button
                onClick={() => setBadgeSidebarVisible(!isBadgeSidebarVisible)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isBadgeSidebarVisible ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isBadgeSidebarVisible ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
              <span className="text-sm text-gray-400">Customer ID</span>
              <span className="font-mono text-xs text-gray-500">{customer.id}</span>
            </div>
          </div>
        </div>

        {/* Badge Showcase - Keep as is, it's already well designed */}
        <div className="mt-4 sm:mt-6">
          <ModernBadgeShowcase userId={customer.uid} userStats={stats} />
        </div>
      </main>
    </div>
  );
}