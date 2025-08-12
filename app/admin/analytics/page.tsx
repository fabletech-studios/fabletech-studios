'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, TrendingUp, Users, PlayCircle, 
  DollarSign, Clock, Calendar, ChevronDown,
  Activity, Eye, Award, Globe
} from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/analytics/analytics-service';
import PremiumLogo from '@/components/PremiumLogo';

interface AnalyticsData {
  today: { plays: number; uniqueUsers: number };
  week: { plays: number; uniqueUsers: number };
  month: { plays: number; uniqueUsers: number };
  topEpisodes: any[];
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalyticsSummary();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStats = () => {
    if (!analytics) return { plays: 0, uniqueUsers: 0 };
    return analytics[timeRange];
  };

  const stats = getCurrentStats();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <PremiumLogo size="md" />
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/manage" className="text-gray-300 hover:text-white transition-colors">
                  Content
                </Link>
                <span className="text-red-500 font-medium">Analytics</span>
                <Link href="/admin/monitoring" className="text-gray-300 hover:text-white transition-colors">
                  Monitoring
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your audiobook platform performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                timeRange === range
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <PlayCircle className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-blue-400 uppercase">Plays</span>
                </div>
                <div className="text-3xl font-bold">{stats.plays.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Total plays</div>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-green-400" />
                  <span className="text-xs text-green-400 uppercase">Users</span>
                </div>
                <div className="text-3xl font-bold">{stats.uniqueUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Unique listeners</div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-purple-400" />
                  <span className="text-xs text-purple-400 uppercase">Engagement</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.plays && stats.uniqueUsers 
                    ? (stats.plays / stats.uniqueUsers).toFixed(1)
                    : '0'}
                </div>
                <div className="text-sm text-gray-400 mt-1">Plays per user</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  <span className="text-xs text-yellow-400 uppercase">Growth</span>
                </div>
                <div className="text-3xl font-bold">+12%</div>
                <div className="text-sm text-gray-400 mt-1">vs last period</div>
              </div>
            </div>

            {/* Top Episodes */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Episodes
              </h2>
              
              {analytics?.topEpisodes && analytics.topEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topEpisodes.slice(0, 5).map((episode, index) => (
                    <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-gray-300'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{episode.episodeTitle}</div>
                          <div className="text-sm text-gray-400">{episode.seriesTitle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{episode.totalPlays}</div>
                        <div className="text-xs text-gray-400">plays</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No episode data yet</p>
              )}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Daily Plays
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-400" />
                  Geographic Distribution
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Map visualization coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}