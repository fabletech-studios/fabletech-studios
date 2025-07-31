// Client-side error logging utility

interface ErrorLog {
  message: string;
  stack?: string;
  source?: string;
  timestamp: number;
  type: 'error' | 'warning';
  userAgent: string;
  url: string;
}

class ClientLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  log(error: Error | string, type: 'error' | 'warning' = 'error', source?: string) {
    if (typeof window === 'undefined') return;

    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      source,
      timestamp: Date.now(),
      type,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(errorLog);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in sessionStorage for debugging
    try {
      sessionStorage.setItem('error_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    try {
      sessionStorage.removeItem('error_logs');
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Check if error is from browser extension
  isExtensionError(error: Error | string): boolean {
    const errorStr = typeof error === 'string' ? error : error.toString();
    const patterns = [
      'chrome-extension://',
      'moz-extension://',
      'mce-autosize-textarea',
      'webcomponents-ce.js',
      'overlay_bundle.js',
      'grammarly',
      'lastpass',
      '1password'
    ];
    
    return patterns.some(pattern => errorStr.toLowerCase().includes(pattern));
  }

  // Check if error is a React hydration error
  isHydrationError(error: Error | string): boolean {
    const errorStr = typeof error === 'string' ? error : error.toString();
    const patterns = [
      'hydration',
      'did not match',
      'server HTML',
      'removeChild',
      'insertBefore',
      'appendChild'
    ];
    
    return patterns.some(pattern => errorStr.toLowerCase().includes(pattern));
  }
}

export const clientLogger = new ClientLogger();