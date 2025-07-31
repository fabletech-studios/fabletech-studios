'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, DollarSign, Users, AlertCircle, 
  CheckCircle, TrendingUp, Clock, CreditCard 
} from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: Date;
}

interface PaymentMetrics {
  todayRevenue: number;
  todayTransactions: number;
  successRate: number;
  averageOrderValue: number;
  failedPayments: number;
}

export default function MonitoringDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
    runHealthChecks();
    fetchPaymentMetrics();
    fetchRecentErrors();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      runHealthChecks();
      fetchPaymentMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      const adminEmails = ['admin@fabletech.com', 'admin@fabletech.studio'];
      if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  };

  const runHealthChecks = async () => {
    const checks: HealthCheck[] = [];

    // Check main site
    const siteStart = Date.now();
    try {
      const response = await fetch('/api/health');
      checks.push({
        service: 'Main Site',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - siteStart,
        lastChecked: new Date()
      });
    } catch {
      checks.push({
        service: 'Main Site',
        status: 'down',
        lastChecked: new Date()
      });
    }

    // Check Stripe
    const stripeStart = Date.now();
    try {
      const response = await fetch('/api/health/stripe');
      checks.push({
        service: 'Stripe API',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - stripeStart,
        lastChecked: new Date()
      });
    } catch {
      checks.push({
        service: 'Stripe API',
        status: 'down',
        lastChecked: new Date()
      });
    }

    // Check Firebase
    const firebaseStart = Date.now();
    try {
      const response = await fetch('/api/health/firebase');
      checks.push({
        service: 'Firebase',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - firebaseStart,
        lastChecked: new Date()
      });
    } catch {
      checks.push({
        service: 'Firebase',
        status: 'down',
        lastChecked: new Date()
      });
    }

    setHealthChecks(checks);
    setIsLoading(false);
  };

  const fetchPaymentMetrics = async () => {
    try {
      const response = await fetch('/api/admin/payment-metrics');
      if (response.ok) {
        const data = await response.json();
        setPaymentMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment metrics:', error);
    }
  };

  const fetchRecentErrors = async () => {
    try {
      const response = await fetch('/api/admin/errors');
      if (response.ok) {
        const data = await response.json();
        setRecentErrors(data.errors || []);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertCircle className="w-5 h-5" />;
      case 'down': return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <PremiumLogo />
            <h1 className="text-2xl font-bold">Production Monitoring</h1>
          </div>
          <div className="text-sm text-gray-400">
            <div>Domain: {typeof window !== 'undefined' ? window.location.hostname : 'fabletech.studio'}</div>
            <div>Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {healthChecks.map((check) => (
            <div key={check.service} className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{check.service}</h3>
                <div className={`flex items-center gap-2 ${getStatusColor(check.status)}`}>
                  {getStatusIcon(check.status)}
                  <span className="capitalize">{check.status}</span>
                </div>
              </div>
              {check.responseTime && (
                <div className="text-sm text-gray-400">
                  Response time: {check.responseTime}ms
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Checked: {check.lastChecked.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Metrics */}
        {paymentMetrics && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              Payment Metrics (Today)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <div className="text-sm text-gray-400">Revenue</div>
                <div className="text-2xl font-bold text-green-500">
                  ${paymentMetrics.todayRevenue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Transactions</div>
                <div className="text-2xl font-bold">
                  {paymentMetrics.todayTransactions}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Success Rate</div>
                <div className="text-2xl font-bold text-green-500">
                  {paymentMetrics.successRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Avg Order</div>
                <div className="text-2xl font-bold">
                  ${paymentMetrics.averageOrderValue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Failed</div>
                <div className="text-2xl font-bold text-red-500">
                  {paymentMetrics.failedPayments}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {recentErrors.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Recent Errors
            </h2>
            <div className="space-y-4">
              {recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="bg-black/50 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-red-400">{error.message}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {error.endpoint} • {error.timestamp}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {error.count}x
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Stripe Dashboard
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Vercel Dashboard
          </a>
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Firebase Console
          </a>
        </div>
      </div>
    </div>
  );
}