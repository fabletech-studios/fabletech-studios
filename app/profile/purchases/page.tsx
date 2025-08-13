'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Filter,
  Search,
  ChevronDown,
  Package,
  Coins,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import PremiumLogo from '@/components/PremiumLogo';
import MainNavigation from '@/components/MainNavigation';
import CustomerHeader from '@/components/CustomerHeader';
import MobileNav from '@/components/MobileNav';

interface Purchase {
  id: string;
  type: string;
  packageId: string;
  packageName?: string;
  amount: number;
  credits: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  stripeSessionId?: string;
  createdAt: any;
}

type TimeFilter = '30days' | '3months' | 'all';

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { customer } = useFirebaseCustomerAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!customer) {
      router.push('/login?redirect=/profile/purchases');
      return;
    }
    fetchPurchases();
  }, [customer, router]);

  useEffect(() => {
    filterPurchases();
  }, [purchases, timeFilter, searchTerm]);

  const fetchPurchases = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    try {
      const response = await fetch('/api/customer/purchases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    let filtered = [...purchases];

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (timeFilter === '30days') {
        filterDate.setDate(now.getDate() - 30);
      } else if (timeFilter === '3months') {
        filterDate.setMonth(now.getMonth() - 3);
      }

      filtered = filtered.filter(purchase => {
        const purchaseDate = purchase.createdAt?.toDate ? purchase.createdAt.toDate() : new Date(purchase.createdAt);
        return purchaseDate >= filterDate;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.packageName?.toLowerCase().includes(search) ||
        purchase.id.toLowerCase().includes(search) ||
        purchase.stripeSessionId?.toLowerCase().includes(search)
      );
    }

    setFilteredPurchases(filtered);
  };

  const formatDate = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getPackageDetails = (packageId: string) => {
    const packages: Record<string, { name: string; icon: JSX.Element }> = {
      starter: { name: 'Starter Pack', icon: <Package className="w-4 h-4" /> },
      popular: { name: 'Popular Pack', icon: <Package className="w-4 h-4" /> },
      premium: { name: 'Premium Pack', icon: <Package className="w-4 h-4" /> }
    };
    return packages[packageId] || { name: packageId, icon: <Package className="w-4 h-4" /> };
  };

  const downloadReceipt = async (purchase: Purchase) => {
    // In a real app, this would generate a PDF receipt
    const receipt = `
FABLETECH STUDIOS
RECEIPT

Transaction ID: ${purchase.id}
Date: ${formatDate(purchase.createdAt)}
Package: ${getPackageDetails(purchase.packageId).name}
Credits: ${purchase.credits}
Amount: ${formatAmount(purchase.amount)}
Status: ${purchase.status}

Thank you for your purchase!
    `.trim();

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${purchase.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Package', 'Credits', 'Amount', 'Status', 'Transaction ID'];
    const rows = filteredPurchases.map(p => [
      formatDate(p.createdAt),
      getPackageDetails(p.packageId).name,
      p.credits,
      formatAmount(p.amount),
      p.status,
      p.id
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-gray-800">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Purchase History</h1>
          <p className="text-gray-400">View and manage your credit purchases</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by package name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={exportToCSV}
                disabled={filteredPurchases.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-800"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFilter === 'all' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setTimeFilter('30days')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFilter === '30days' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setTimeFilter('3months')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFilter === '3months' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Last 3 Months
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Purchase List */}
        {filteredPurchases.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {purchases.length === 0 ? 'No purchases yet' : 'No matching purchases'}
            </h3>
            <p className="text-gray-400 mb-6">
              {purchases.length === 0 
                ? 'Your purchase history will appear here'
                : 'Try adjusting your filters or search term'
              }
            </p>
            {purchases.length === 0 && (
              <Link
                href="/credits/purchase"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Coins className="w-5 h-5" />
                Buy Credits
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Package</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Credits</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredPurchases.map((purchase) => {
                    const packageInfo = getPackageDetails(purchase.packageId);
                    return (
                      <tr key={purchase.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatDate(purchase.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {packageInfo.icon}
                            <span className="font-medium">{packageInfo.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{purchase.credits}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-500 font-semibold">{formatAmount(purchase.amount)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(purchase.status)}
                            <span className="capitalize">{purchase.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => downloadReceipt(purchase)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-500 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredPurchases.map((purchase) => {
                const packageInfo = getPackageDetails(purchase.packageId);
                return (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {packageInfo.icon}
                          <span className="font-semibold">{packageInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(purchase.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(purchase.status)}
                        <span className="capitalize text-sm">{purchase.status}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{purchase.credits}</span>
                        </div>
                        <span className="text-green-500 font-semibold">{formatAmount(purchase.amount)}</span>
                      </div>
                      <button
                        onClick={() => downloadReceipt(purchase)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-500 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Receipt</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {purchases.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-400">Total Purchases</p>
                  <p className="text-2xl font-bold">{purchases.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-400">Total Credits</p>
                  <p className="text-2xl font-bold">
                    {purchases.reduce((sum, p) => sum + p.credits, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(purchases.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}