// Silently hide browser extension and React DOM errors
(function() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const shouldHide = (args) => {
    const str = String(args[0]);
    return str.includes('chrome-extension://') || 
           str.includes('moz-extension://') ||
           str.includes('mce-autosize-textarea') ||
           str.includes('MetaMask') ||
           str.includes('webcomponents-ce.js') ||
           str.includes('overlay_bundle.js') ||
           str.includes('inpage.js') ||
           str.includes('Suppressed React DOM error') ||
           str.includes('removeChild') ||
           str.includes('insertBefore') ||
           str.includes('appendChild');
  };
  
  console.log = function(...args) {
    if (!shouldHide(args)) {
      originalLog.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    if (!shouldHide(args)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    if (!shouldHide(args)) {
      originalWarn.apply(console, args);
    }
  };
})();