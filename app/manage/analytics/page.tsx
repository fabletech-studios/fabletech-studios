'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalCreditsUsed: 0,
    activeUsers: 0,
    newUsersToday: 0,
    revenueToday: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setStats({
        totalUsers: 1243,
        totalRevenue: 15673.50,
        totalCreditsUsed: 45892,
        activeUsers: 342,
        newUsersToday: 12,
        revenueToday: 234.50
      });
      setLoading(false);
    }, 1000);
  }, []);
  
  const StatCard = ({ title, value, subtitle, icon }: any) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
  
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Analytics Dashboard</h1>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                subtitle={`+${stats.newUsersToday} today`}
                icon="👥"
              />
              <StatCard
                title="Total Revenue"
                value={`$${stats.totalRevenue.toLocaleString()}`}
                subtitle={`+$${stats.revenueToday} today`}
                icon="💰"
              />
              <StatCard
                title="Credits Used"
                value={stats.totalCreditsUsed.toLocaleString()}
                subtitle="All time"
                icon="🎫"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers.toLocaleString()}
                subtitle="Last 7 days"
                icon="📊"
              />
              <StatCard
                title="Conversion Rate"
                value="12.3%"
                subtitle="Free to paid"
                icon="📈"
              />
              <StatCard
                title="Avg. Credits/User"
                value="37"
                subtitle="Per month"
                icon="⚡"
              />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Revenue Trend</h2>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Chart visualization would go here</p>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">User Growth</h2>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Chart visualization would go here</p>
                </div>
              </div>
            </div>
            
            {/* Top Content */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Top Performing Content</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">Title</th>
                      <th className="text-left py-3 px-4 text-gray-400">Views</th>
                      <th className="text-left py-3 px-4 text-gray-400">Credits Earned</th>
                      <th className="text-left py-3 px-4 text-gray-400">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-white">The Mystery at Midnight</td>
                      <td className="py-3 px-4 text-gray-300">1,234</td>
                      <td className="py-3 px-4 text-gray-300">3,702</td>
                      <td className="py-3 px-4 text-gray-300">4.8 ⭐</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-white">Journey to the Stars</td>
                      <td className="py-3 px-4 text-gray-300">987</td>
                      <td className="py-3 px-4 text-gray-300">2,961</td>
                      <td className="py-3 px-4 text-gray-300">4.7 ⭐</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-white">The Hidden Path</td>
                      <td className="py-3 px-4 text-gray-300">856</td>
                      <td className="py-3 px-4 text-gray-300">2,568</td>
                      <td className="py-3 px-4 text-gray-300">4.9 ⭐</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                  <div>
                    <p className="text-white">New user registration</p>
                    <p className="text-sm text-gray-400">john.doe@example.com</p>
                  </div>
                  <span className="text-sm text-gray-500">5 min ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                  <div>
                    <p className="text-white">Credit purchase</p>
                    <p className="text-sm text-gray-400">100 credits for $9.99</p>
                  </div>
                  <span className="text-sm text-gray-500">12 min ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                  <div>
                    <p className="text-white">Episode unlocked</p>
                    <p className="text-sm text-gray-400">The Mystery at Midnight - Episode 3</p>
                  </div>
                  <span className="text-sm text-gray-500">18 min ago</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}