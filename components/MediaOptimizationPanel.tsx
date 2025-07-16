'use client';

import { useState } from 'react';
import { AlertCircle, TrendingDown, DollarSign, Info, ChevronDown, ChevronUp, Zap, Download } from 'lucide-react';
import { 
  analyzeFileOptimization, 
  calculateStorageCost, 
  getMediaRecommendations, 
  formatFileSize,
  type FileValidationResult 
} from '@/lib/file-validation';
import { 
  compressFile, 
  isCompressionAvailable, 
  getCompressionRecommendations,
  type CompressionResult 
} from '@/lib/media-compression';

interface MediaOptimizationPanelProps {
  videoFile?: File | null;
  audioFile?: File | null;
  videoValidation?: FileValidationResult | null;
  audioValidation?: FileValidationResult | null;
  onFileCompressed?: (originalFile: File, compressedFile: File) => void;
}

export default function MediaOptimizationPanel({ 
  videoFile, 
  audioFile, 
  videoValidation, 
  audioValidation,
  onFileCompressed
}: MediaOptimizationPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [compressing, setCompressing] = useState<string | null>(null);
  const [compressionResults, setCompressionResults] = useState<{ [key: string]: CompressionResult }>({});
  
  const recommendations = getMediaRecommendations();
  
  // Calculate total file size and optimization potential
  const totalSize = (videoFile?.size || 0) + (audioFile?.size || 0);
  const hasFiles = videoFile || audioFile;
  
  if (!hasFiles) return null;

  // Analyze optimization potential
  const videoAnalysis = videoFile ? analyzeFileOptimization(videoFile) : null;
  const audioAnalysis = audioFile ? analyzeFileOptimization(audioFile) : null;
  
  const canOptimize = videoAnalysis?.canOptimize || audioAnalysis?.canOptimize;
  const estimatedSavings = Math.max(
    videoAnalysis?.estimatedSavings || 0,
    audioAnalysis?.estimatedSavings || 0
  );

  // Calculate costs (assume 100 downloads per month as example)
  const monthlyCosts = calculateStorageCost(totalSize, 100);
  const optimizedSize = totalSize * (1 - estimatedSavings);
  const optimizedCosts = calculateStorageCost(optimizedSize, 100);
  const costSavings = monthlyCosts.total - optimizedCosts.total;

  // Compression handlers
  const handleCompress = async (file: File, type: 'video' | 'audio' | 'image') => {
    setCompressing(type);
    
    try {
      const result = await compressFile(file);
      setCompressionResults(prev => ({ ...prev, [type]: result }));
      
      if (result.success && result.file && onFileCompressed) {
        onFileCompressed(file, result.file);
      }
    } catch (error) {
      console.error('Compression error:', error);
      setCompressionResults(prev => ({ 
        ...prev, 
        [type]: {
          success: false,
          originalSize: file.size,
          compressedSize: file.size,
          savingsPercent: 0,
          error: 'Compression failed: ' + (error as Error).message
        }
      }));
    } finally {
      setCompressing(null);
    }
  };

  const downloadCompressedFile = (file: File, type: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-400" />
          Media Optimization
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white"
        >
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-xs text-gray-400">Total File Size</div>
          <div className="text-lg font-semibold">{formatFileSize(totalSize)}</div>
        </div>
        
        <div className="bg-gray-800 rounded p-3">
          <div className="text-xs text-gray-400">Monthly Storage Cost</div>
          <div className="text-lg font-semibold text-green-400">${monthlyCosts.total}</div>
        </div>
        
        {canOptimize && (
          <div className="bg-gray-800 rounded p-3">
            <div className="text-xs text-gray-400">Potential Savings</div>
            <div className="text-lg font-semibold text-blue-400">
              {(estimatedSavings * 100).toFixed(0)}% size
            </div>
          </div>
        )}
      </div>

      {/* Validation Warnings */}
      {(videoValidation?.recommendation || audioValidation?.recommendation) && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-400 mb-1">Optimization Recommendations:</p>
              {videoValidation?.recommendation && (
                <p className="text-gray-300 mb-2">• Video: {videoValidation.recommendation}</p>
              )}
              {audioValidation?.recommendation && (
                <p className="text-gray-300">• Audio: {audioValidation.recommendation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {showDetails && (
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Cost Analysis (100 downloads/month)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Storage: ${monthlyCosts.storageMonthly}</div>
                <div className="text-gray-400">Bandwidth: ${monthlyCosts.bandwidthMonthly}</div>
                <div className="font-medium">Total: ${monthlyCosts.total}</div>
              </div>
              {canOptimize && (
                <div>
                  <div className="text-gray-400">Optimized Size: {formatFileSize(optimizedSize)}</div>
                  <div className="text-gray-400">Optimized Cost: ${optimizedCosts.total}</div>
                  <div className="font-medium text-green-400">
                    Monthly Savings: ${costSavings.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compression Actions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              File Compression
            </h4>
            <div className="space-y-3">
              {videoFile && (
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="font-medium">Video: {videoFile.name}</div>
                    <div className="text-sm text-gray-400">{formatFileSize(videoFile.size)}</div>
                    {compressionResults.video && (
                      <div className="text-xs mt-1">
                        {compressionResults.video.success ? (
                          <span className="text-green-400">
                            Compressed: {formatFileSize(compressionResults.video.compressedSize)} 
                            ({compressionResults.video.savingsPercent.toFixed(1)}% savings)
                          </span>
                        ) : (
                          <span className="text-red-400">{compressionResults.video.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCompressionAvailable(videoFile) ? (
                      <button
                        onClick={() => handleCompress(videoFile, 'video')}
                        disabled={compressing === 'video'}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
                      >
                        {compressing === 'video' ? 'Compressing...' : 'Compress'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Use external tools</span>
                    )}
                    {compressionResults.video?.success && compressionResults.video.file && (
                      <button
                        onClick={() => downloadCompressedFile(compressionResults.video.file!, 'video')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {audioFile && (
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="font-medium">Audio: {audioFile.name}</div>
                    <div className="text-sm text-gray-400">{formatFileSize(audioFile.size)}</div>
                    {compressionResults.audio && (
                      <div className="text-xs mt-1">
                        {compressionResults.audio.success ? (
                          <span className="text-green-400">
                            Compressed: {formatFileSize(compressionResults.audio.compressedSize)} 
                            ({compressionResults.audio.savingsPercent.toFixed(1)}% savings)
                          </span>
                        ) : (
                          <span className="text-red-400">{compressionResults.audio.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCompressionAvailable(audioFile) ? (
                      <button
                        onClick={() => handleCompress(audioFile, 'audio')}
                        disabled={compressing === 'audio'}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
                      >
                        {compressing === 'audio' ? 'Compressing...' : 'Compress'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Use external tools</span>
                    )}
                    {compressionResults.audio?.success && compressionResults.audio.file && (
                      <button
                        onClick={() => downloadCompressedFile(compressionResults.audio.file!, 'audio')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File-specific Recommendations */}
          {(videoAnalysis?.recommendations.length || audioAnalysis?.recommendations.length) && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Optimization Opportunities</h4>
              <div className="space-y-2 text-sm">
                {videoAnalysis?.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{rec}</span>
                  </div>
                ))}
                {audioAnalysis?.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Recommendations */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                Best Practices
              </h4>
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="text-xs text-gray-400 hover:text-white"
              >
                {showRecommendations ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showRecommendations && (
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium text-blue-400 mb-1">Video Optimization:</h5>
                  {recommendations.video.map((tip, index) => (
                    <div key={index} className="text-gray-300 ml-2">• {tip}</div>
                  ))}
                </div>
                <div>
                  <h5 className="font-medium text-green-400 mb-1">Audio Optimization:</h5>
                  {recommendations.audio.map((tip, index) => (
                    <div key={index} className="text-gray-300 ml-2">• {tip}</div>
                  ))}
                </div>
                <div>
                  <h5 className="font-medium text-purple-400 mb-1">General Tips:</h5>
                  {recommendations.general.map((tip, index) => (
                    <div key={index} className="text-gray-300 ml-2">• {tip}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}