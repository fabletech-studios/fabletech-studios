'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Download, Camera, Activity, User } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ViolationType } from '@/lib/firebase/violation-service';

interface ViolationRecord {
  id: string;
  userId: string;
  type: ViolationType;
  contentId?: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  detection?: {
    method: string;
    confidence: number;
  };
  metadata?: any;
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ViolationType>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<ViolationType, number>,
    uniqueUsers: 0,
    todayCount: 0
  });

  useEffect(() => {
    loadViolations();
  }, [filter, timeRange]);

  const loadViolations = async () => {
    try {
      setLoading(true);
      
      // Calculate time filter
      let startDate = new Date();
      if (timeRange === '24h') startDate.setHours(startDate.getHours() - 24);
      else if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else startDate = new Date(0); // All time

      // Build query
      let q = query(
        collection(db, 'violations'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      if (filter !== 'all') {
        q = query(
          collection(db, 'violations'),
          where('type', '==', filter),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const violationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ViolationRecord[];

      // Filter by time range
      const filteredViolations = violationData.filter(v => 
        v.timestamp && v.timestamp.toDate() > startDate
      );

      setViolations(filteredViolations);

      // Calculate stats
      const uniqueUsers = new Set(filteredViolations.map(v => v.userId));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayViolations = filteredViolations.filter(v => 
        v.timestamp && v.timestamp.toDate() > today
      );

      const byType = {} as Record<ViolationType, number>;
      Object.values(ViolationType).forEach(type => {
        byType[type] = filteredViolations.filter(v => v.type === type).length;
      });

      setStats({
        total: filteredViolations.length,
        byType,
        uniqueUsers: uniqueUsers.size,
        todayCount: todayViolations.length
      });

    } catch (error) {
      console.error('Error loading violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViolationIcon = (type: ViolationType) => {
    switch (type) {
      case ViolationType.SCREEN_RECORDING:
        return <Camera className="w-4 h-4" />;
      case ViolationType.DOWNLOAD_ATTEMPT:
        return <Download className="w-4 h-4" />;
      case ViolationType.COPYRIGHT_VIOLATION:
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getViolationColor = (type: ViolationType) => {
    switch (type) {
      case ViolationType.SCREEN_RECORDING:
        return 'text-red-500';
      case ViolationType.DOWNLOAD_ATTEMPT:
        return 'text-orange-500';
      case ViolationType.COPYRIGHT_VIOLATION:
        return 'text-purple-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Content Protection Violations</h1>
        <p className="text-gray-400">Monitor and manage copyright protection violations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-white">{stats.total}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Violations</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <User className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-white">{stats.uniqueUsers}</span>
          </div>
          <p className="text-gray-400 text-sm">Unique Users</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Camera className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-white">
              {stats.byType[ViolationType.SCREEN_RECORDING] || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Screen Recordings</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <span className="text-3xl font-bold text-white">{stats.todayCount}</span>
          </div>
          <p className="text-gray-400 text-sm">Today's Violations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="all">All Types</option>
          {Object.values(ViolationType).map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>

        <button
          onClick={loadViolations}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Violations Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Detection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {violations.map((violation) => (
              <tr key={violation.id} className="hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={getViolationColor(violation.type)}>
                      {getViolationIcon(violation.type)}
                    </span>
                    <span className="text-sm text-gray-300">
                      {violation.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {violation.userId.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {violation.contentId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {violation.detection ? (
                    <div>
                      <p>{violation.detection.method.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {Math.round(violation.detection.confidence * 100)}%
                      </p>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {violation.ipAddress || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {violation.timestamp?.toDate().toLocaleString() || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {violations.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No violations found</p>
          </div>
        )}
      </div>
    </div>
  );
}