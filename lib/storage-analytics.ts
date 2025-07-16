// Storage analytics and cost analysis for Firebase Storage

export interface StorageUsage {
  totalFiles: number;
  totalSize: number;
  byType: {
    video: { count: number; size: number };
    audio: { count: number; size: number };
    images: { count: number; size: number };
    other: { count: number; size: number };
  };
}

export interface CostAnalysis {
  monthly: {
    storage: number;
    bandwidth: number;
    operations: number;
    total: number;
  };
  yearly: {
    storage: number;
    bandwidth: number;
    operations: number;
    total: number;
  };
  projections: {
    growthRate: number;
    nextMonthTotal: number;
    nextYearTotal: number;
  };
}

export interface OptimizationSuggestions {
  potentialSavings: number;
  recommendations: Array<{
    type: 'compression' | 'format' | 'cleanup' | 'caching';
    description: string;
    estimatedSavings: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// Firebase Storage pricing (2025 rates)
const PRICING = {
  STORAGE_PER_GB: 0.026, // $0.026 per GB stored per month
  BANDWIDTH_PER_GB: 0.20, // $0.20 per GB download (Aug 2025 update)
  OPERATIONS: {
    UPLOAD_PER_10K: 0.05, // $0.05 per 10k upload operations
    DOWNLOAD_PER_10K: 0.004, // $0.004 per 10k download operations
  }
};

// Free tier limits
const FREE_TIER = {
  STORAGE_GB: 1, // 1 GB storage free
  BANDWIDTH_GB: 10, // 10 GB bandwidth free
  UPLOAD_OPS: 20000, // 20k upload operations free per day
  DOWNLOAD_OPS: 50000, // 50k download operations free per day
};

export function calculateStorageUsage(files: Array<{ size: number; type: string }>): StorageUsage {
  const usage: StorageUsage = {
    totalFiles: files.length,
    totalSize: 0,
    byType: {
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      images: { count: 0, size: 0 },
      other: { count: 0, size: 0 }
    }
  };

  files.forEach(file => {
    usage.totalSize += file.size;
    
    if (file.type.startsWith('video/')) {
      usage.byType.video.count++;
      usage.byType.video.size += file.size;
    } else if (file.type.startsWith('audio/')) {
      usage.byType.audio.count++;
      usage.byType.audio.size += file.size;
    } else if (file.type.startsWith('image/')) {
      usage.byType.images.count++;
      usage.byType.images.size += file.size;
    } else {
      usage.byType.other.count++;
      usage.byType.other.size += file.size;
    }
  });

  return usage;
}

export function calculateCosts(
  storageUsage: StorageUsage,
  monthlyDownloads: number = 0,
  monthlyUploads: number = 0
): CostAnalysis {
  // Convert bytes to GB
  const storageGB = storageUsage.totalSize / (1024 * 1024 * 1024);
  const bandwidthGB = (storageUsage.totalSize * monthlyDownloads) / (1024 * 1024 * 1024);
  
  // Calculate billable amounts (after free tier)
  const billableStorageGB = Math.max(0, storageGB - FREE_TIER.STORAGE_GB);
  const billableBandwidthGB = Math.max(0, bandwidthGB - FREE_TIER.BANDWIDTH_GB);
  const billableUploads = Math.max(0, monthlyUploads - (FREE_TIER.UPLOAD_OPS * 30));
  const billableDownloads = Math.max(0, monthlyDownloads - (FREE_TIER.DOWNLOAD_OPS * 30));
  
  // Monthly costs
  const monthlyStorage = billableStorageGB * PRICING.STORAGE_PER_GB;
  const monthlyBandwidth = billableBandwidthGB * PRICING.BANDWIDTH_PER_GB;
  const monthlyOperations = 
    (billableUploads / 10000) * PRICING.OPERATIONS.UPLOAD_PER_10K +
    (billableDownloads / 10000) * PRICING.OPERATIONS.DOWNLOAD_PER_10K;
  
  const monthlyTotal = monthlyStorage + monthlyBandwidth + monthlyOperations;
  
  // Yearly costs
  const yearlyStorage = monthlyStorage * 12;
  const yearlyBandwidth = monthlyBandwidth * 12;
  const yearlyOperations = monthlyOperations * 12;
  const yearlyTotal = monthlyTotal * 12;
  
  // Growth projections (assume 10% monthly growth)
  const growthRate = 0.10;
  const nextMonthTotal = monthlyTotal * (1 + growthRate);
  const nextYearTotal = yearlyTotal * Math.pow(1 + growthRate, 12);

  return {
    monthly: {
      storage: parseFloat(monthlyStorage.toFixed(4)),
      bandwidth: parseFloat(monthlyBandwidth.toFixed(4)),
      operations: parseFloat(monthlyOperations.toFixed(4)),
      total: parseFloat(monthlyTotal.toFixed(4))
    },
    yearly: {
      storage: parseFloat(yearlyStorage.toFixed(2)),
      bandwidth: parseFloat(yearlyBandwidth.toFixed(2)),
      operations: parseFloat(yearlyOperations.toFixed(2)),
      total: parseFloat(yearlyTotal.toFixed(2))
    },
    projections: {
      growthRate,
      nextMonthTotal: parseFloat(nextMonthTotal.toFixed(4)),
      nextYearTotal: parseFloat(nextYearTotal.toFixed(2))
    }
  };
}

export function generateOptimizationSuggestions(
  usage: StorageUsage,
  costs: CostAnalysis
): OptimizationSuggestions {
  const recommendations: OptimizationSuggestions['recommendations'] = [];
  let potentialSavings = 0;

  // Video compression recommendations
  if (usage.byType.video.size > 100 * 1024 * 1024) { // > 100MB of video
    const videoSavings = (usage.byType.video.size * 0.5) / (1024 * 1024 * 1024) * PRICING.STORAGE_PER_GB;
    potentialSavings += videoSavings;
    
    recommendations.push({
      type: 'compression',
      description: `Compress ${usage.byType.video.count} video files to reduce storage by ~50%`,
      estimatedSavings: videoSavings,
      priority: 'high'
    });
  }

  // Audio format optimization
  if (usage.byType.audio.size > 50 * 1024 * 1024) { // > 50MB of audio
    const audioSavings = (usage.byType.audio.size * 0.3) / (1024 * 1024 * 1024) * PRICING.STORAGE_PER_GB;
    potentialSavings += audioSavings;
    
    recommendations.push({
      type: 'format',
      description: `Convert audio files to AAC format for ~30% size reduction`,
      estimatedSavings: audioSavings,
      priority: 'medium'
    });
  }

  // Image optimization
  if (usage.byType.images.size > 10 * 1024 * 1024) { // > 10MB of images
    const imageSavings = (usage.byType.images.size * 0.4) / (1024 * 1024 * 1024) * PRICING.STORAGE_PER_GB;
    potentialSavings += imageSavings;
    
    recommendations.push({
      type: 'compression',
      description: `Optimize ${usage.byType.images.count} images with better compression`,
      estimatedSavings: imageSavings,
      priority: 'medium'
    });
  }

  // CDN/Caching recommendations
  if (costs.monthly.bandwidth > 5) { // > $5 monthly bandwidth
    const cachingSavings = costs.monthly.bandwidth * 0.3;
    potentialSavings += cachingSavings;
    
    recommendations.push({
      type: 'caching',
      description: 'Implement CDN caching to reduce bandwidth costs by ~30%',
      estimatedSavings: cachingSavings,
      priority: 'high'
    });
  }

  // File cleanup recommendations
  if (usage.totalFiles > 1000) {
    recommendations.push({
      type: 'cleanup',
      description: 'Review and remove unused files or old versions',
      estimatedSavings: 0,
      priority: 'low'
    });
  }

  return {
    potentialSavings: parseFloat(potentialSavings.toFixed(4)),
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(amount);
}

// Sample data for testing/demo purposes
export function generateSampleAnalytics(): {
  usage: StorageUsage;
  costs: CostAnalysis;
  suggestions: OptimizationSuggestions;
} {
  const sampleFiles = [
    // Videos
    { size: 250 * 1024 * 1024, type: 'video/mp4' }, // 250MB
    { size: 300 * 1024 * 1024, type: 'video/mp4' }, // 300MB
    { size: 180 * 1024 * 1024, type: 'video/mp4' }, // 180MB
    
    // Audio
    { size: 45 * 1024 * 1024, type: 'audio/mp3' }, // 45MB
    { size: 38 * 1024 * 1024, type: 'audio/mp3' }, // 38MB
    { size: 52 * 1024 * 1024, type: 'audio/aac' }, // 52MB
    
    // Images
    { size: 2 * 1024 * 1024, type: 'image/jpeg' }, // 2MB
    { size: 1.5 * 1024 * 1024, type: 'image/png' }, // 1.5MB
    { size: 800 * 1024, type: 'image/webp' }, // 800KB
  ];

  const usage = calculateStorageUsage(sampleFiles);
  const costs = calculateCosts(usage, 100, 50); // 100 downloads, 50 uploads per month
  const suggestions = generateOptimizationSuggestions(usage, costs);

  return { usage, costs, suggestions };
}