'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

export default class RecoveryBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignore browser extension errors
    if (
      error.message?.includes('mce-autosize-textarea') ||
      error.message?.includes('custom element') ||
      error.stack?.includes('chrome-extension://') ||
      error.stack?.includes('moz-extension://')
    ) {
      console.warn('Ignored browser extension error:', error);
      this.setState({ hasError: false });
      return;
    }

    console.error('RecoveryBoundary caught error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-recover from DOM errors
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('Cannot read properties of null')
    ) {
      this.attemptRecovery();
    }
  }

  attemptRecovery = () => {
    const { errorCount } = this.state;
    
    if (errorCount < 3) {
      console.log(`Attempting recovery (attempt ${errorCount + 1}/3)...`);
      
      this.retryTimeoutId = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          errorCount: prevState.errorCount + 1
        }));
      }, 1000);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorCount: 0 });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.errorCount >= 3) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-6">
                We encountered an unexpected error. This might be due to a browser extension conflict.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-black p-3 rounded overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}