// This script runs before any other scripts to suppress extension errors
(function() {
  'use strict';
  
  // Override console methods immediately
  const noop = function() {};
  const originalConsoleError = console.error;
  
  console.error = function(...args) {
    const str = args[0]?.toString() || '';
    if (
      str.includes('mce-autosize-textarea') ||
      str.includes('webcomponents-ce.js') ||
      str.includes('overlay_bundle.js') ||
      str.includes('A custom element with name') ||
      str.includes('has already been defined') ||
      str.includes('chrome-extension://') ||
      str.includes('moz-extension://')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Block custom element definitions from extensions
  if (typeof window !== 'undefined' && window.customElements) {
    const originalDefine = window.customElements.define;
    window.customElements.define = function(name, ...args) {
      if (name.includes('mce-') || name.includes('grammarly-')) {
        return;
      }
      try {
        if (window.customElements.get(name)) {
          return;
        }
        originalDefine.apply(window.customElements, [name, ...args]);
      } catch (e) {
        // Silently ignore
      }
    };
  }

  // Suppress error events
  window.addEventListener('error', function(e) {
    if (
      e.message?.includes('mce-autosize-textarea') ||
      e.message?.includes('custom element') ||
      e.filename?.includes('chrome-extension://') ||
      e.filename?.includes('moz-extension://')
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
})();