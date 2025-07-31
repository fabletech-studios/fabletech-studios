// Hide only browser extension console errors
(function() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const isExtensionError = (args) => {
    const str = String(args[0]);
    return str.includes('chrome-extension://') || 
           str.includes('moz-extension://') ||
           str.includes('mce-autosize-textarea') ||
           str.includes('MetaMask') ||
           str.includes('webcomponents-ce.js') ||
           str.includes('overlay_bundle.js') ||
           str.includes('inpage.js');
  };
  
  console.log = function(...args) {
    if (!isExtensionError(args)) {
      originalLog.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    if (!isExtensionError(args)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    if (!isExtensionError(args)) {
      originalWarn.apply(console, args);
    }
  };
})();