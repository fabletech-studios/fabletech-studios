import React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  fileName?: string;
  error?: string;
}

export default function UploadProgress({ 
  isUploading, 
  progress, 
  status, 
  fileName,
  error 
}: UploadProgressProps) {
  if (!isUploading && status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'uploading' && (
            <>
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Uploading Episode</h3>
              {fileName && (
                <p className="text-sm text-gray-400 mb-4">Processing: {fileName}</p>
              )}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{progress}% complete</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
              <p className="text-sm text-gray-400">Your episode has been added successfully.</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Failed</h3>
              <p className="text-sm text-red-400">{error || 'An error occurred during upload.'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}