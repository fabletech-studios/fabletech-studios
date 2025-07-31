'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

export default class RobustErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Check if it's a DOM manipulation error
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('appendChild')
    ) {
      // Silently handle DOM error
      // Don't show error UI for DOM errors
      return null;
    }
    
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error but don't crash the app for DOM errors
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('appendChild')
    ) {
      // Silently handle DOM error
      
      // Increment error count
      this.setState(prevState => ({ errorCount: prevState.errorCount + 1 }));
      
      // If too many errors, force a reload
      if (this.state.errorCount > 5) {
        // Too many errors, reload
        window.location.reload();
      }
      
      return;
    }
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <button
                onClick={() => {
                  this.setState({ hasError: false, errorCount: 0 });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}