'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch real app errors, not extension errors
    if (error.message?.includes('mce-autosize-textarea') || 
        error.message?.includes('removeChild')) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignore extension and DOM errors
    if (error.message?.includes('mce-autosize-textarea') || 
        error.message?.includes('removeChild')) {
      return;
    }
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <h2 className="text-red-500 font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}