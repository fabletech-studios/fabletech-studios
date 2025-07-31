'use client';

import { useEffect } from 'react';

export default function ExtensionBlocker() {
  useEffect(() => {
    // Block extension scripts from defining custom elements
    const originalDefine = window.customElements?.define;
    
    if (window.customElements && originalDefine) {
      window.customElements.define = function(name: string, ...args: any[]) {
        // Block specific extension elements
        if (
          name.includes('mce-') || 
          name.includes('grammarly-') ||
          name.includes('lastpass-') ||
          name.includes('1password-')
        ) {
          console.log(`[ExtensionBlocker] Blocked custom element: ${name}`);
          return;
        }
        
        // Check if element is already defined
        try {
          if (window.customElements.get(name)) {
            console.log(`[ExtensionBlocker] Element already defined: ${name}`);
            return;
          }
        } catch (e) {
          // Ignore errors
        }
        
        // Call original define for allowed elements
        try {
          return originalDefine.apply(window.customElements, [name, ...args]);
        } catch (e) {
          console.log(`[ExtensionBlocker] Failed to define element: ${name}`, e);
        }
      };
    }

    // Also prevent script injection from extensions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 && // Element node
            node instanceof HTMLElement &&
            (node.tagName === 'SCRIPT' || node.tagName === 'LINK')
          ) {
            const src = (node as HTMLScriptElement).src || (node as HTMLLinkElement).href || '';
            if (
              src.includes('chrome-extension://') ||
              src.includes('moz-extension://') ||
              src.includes('grammarly') ||
              src.includes('lastpass')
            ) {
              console.log(`[ExtensionBlocker] Blocked extension resource: ${src}`);
              node.remove();
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
      if (window.customElements && originalDefine) {
        window.customElements.define = originalDefine;
      }
    };
  }, []);

  return null;
}