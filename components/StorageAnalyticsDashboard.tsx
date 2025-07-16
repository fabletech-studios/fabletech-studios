'use client';

import { useState, useEffect } from 'react';
import { 
  Database, DollarSign, TrendingUp, HardDrive, 
  Download, Upload, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, FileVideo, Volume2, Image
} from 'lucide-react';
import { 
  generateSampleAnalytics, 
  formatBytes, 
  formatCurrency,
  type StorageUsage,
  type CostAnalysis,
  type OptimizationSuggestions
} from '@/lib/storage-analytics';

export default function StorageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<{
    usage: StorageUsage;
    costs: CostAnalysis;
    suggestions: OptimizationSuggestions;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch actual storage data
    // For now, using sample data to demonstrate the analytics
    const sampleData = generateSampleAnalytics();
    setAnalytics(sampleData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { usage, costs, suggestions } = analytics;

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Storage Analytics & Cost Analysis
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Total Storage</span>
          </div>
          <div className="text-2xl font-bold">{formatBytes(usage.totalSize)}</div>
          <div className="text-xs text-gray-500">{usage.totalFiles} files</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Monthly Cost</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(costs.monthly.total)}</div>
          <div className="text-xs text-gray-500">Current usage</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Projected Growth</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{formatCurrency(costs.projections.nextMonthTotal)}</div>
          <div className="text-xs text-gray-500">Next month</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Potential Savings</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{formatCurrency(suggestions.potentialSavings)}</div>
          <div className="text-xs text-gray-500">Monthly</div>
        </div>
      </div>

      {/* File Type Breakdown */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-3">Storage by File Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-red-400" />
              <span className="text-sm">Videos</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatBytes(usage.byType.video.size)}</div>
              <div className="text-xs text-gray-400">{usage.byType.video.count} files</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-green-400" />
              <span className="text-sm">Audio</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatBytes(usage.byType.audio.size)}</div>
              <div className="text-xs text-gray-400">{usage.byType.audio.count} files</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Images</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatBytes(usage.byType.images.size)}</div>
              <div className="text-xs text-gray-400">{usage.byType.images.count} files</div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {suggestions.recommendations.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Optimization Recommendations
          </h4>
          <div className="space-y-3">
            {suggestions.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm">{rec.description}</div>
                  <div className="text-xs text-gray-400 capitalize">
                    Priority: {rec.priority} • Type: {rec.type}
                  </div>
                </div>
                {rec.estimatedSavings > 0 && (
                  <div className="text-sm font-medium text-green-400 ml-4">
                    {formatCurrency(rec.estimatedSavings)}/mo
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {showDetails && (
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3">Monthly Cost Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Storage</div>
                <div className="text-lg font-semibold">{formatCurrency(costs.monthly.storage)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Bandwidth</div>
                <div className="text-lg font-semibold">{formatCurrency(costs.monthly.bandwidth)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Operations</div>
                <div className="text-lg font-semibold">{formatCurrency(costs.monthly.operations)}</div>
              </div>
            </div>
          </div>

          {/* Yearly Projections */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3">Yearly Projections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Current Rate</div>
                <div className="text-lg font-semibold">{formatCurrency(costs.yearly.total)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">With Growth (10%/month)</div>
                <div className="text-lg font-semibold text-orange-400">{formatCurrency(costs.projections.nextYearTotal)}</div>
              </div>
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3">Cost Optimization Tips</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Compress videos to MP4 H.264 format at 1-3 Mbps bitrate</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Convert audio to MP3 (128-192 kbps) or AAC (128 kbps)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Optimize images with WebP format for better compression</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Enable CDN caching to reduce bandwidth costs</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Monitor usage regularly and clean up unused files</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note about data */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded text-xs text-gray-400">
        <strong>Note:</strong> This analysis is based on sample data. In production, this would connect to actual Firebase Storage analytics and usage metrics.
      </div>
    </div>
  );
}