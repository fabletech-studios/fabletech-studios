import { useEffect, useCallback, useRef } from 'react';

interface ContentProtectionOptions {
  disableRightClick?: boolean;
  detectDevTools?: boolean;
  detectScreenRecording?: boolean;
  onViolation?: (type: string) => void;
  customMessage?: string;
}

export function useContentProtection({
  disableRightClick = true,
  detectDevTools = false, // Disabled by default for better UX
  detectScreenRecording = false, // Disabled by default for better UX
  onViolation,
  customMessage = 'Content protected by FableTech Studios'
}: ContentProtectionOptions = {}) {
  
  // Cooldown tracking to prevent spam
  const lastViolationTime = useRef<{ [key: string]: number }>({});
  const COOLDOWN_MS = 30000; // 30 seconds cooldown
  
  const handleViolation = useCallback((type: string) => {
    const now = Date.now();
    const lastTime = lastViolationTime.current[type] || 0;
    
    // Check cooldown
    if (now - lastTime < COOLDOWN_MS) {
      return;
    }
    
    lastViolationTime.current[type] = now;
    if (onViolation) {
      onViolation(type);
    }
  }, [onViolation]);
  
  // Disable right-click
  useEffect(() => {
    if (!disableRightClick) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('rightClick');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [disableRightClick, handleViolation]);

  // Detect DevTools (less aggressive)
  useEffect(() => {
    if (!detectDevTools) return;

    let devtools = { open: false };
    const threshold = 200; // Increased threshold to reduce false positives
    let checkInterval: NodeJS.Timeout;
    let consecutiveDetections = 0;

    const checkDevTools = () => {
      // More accurate detection combining multiple checks
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      // Check if the differences are significant and consistent
      if (widthDiff > threshold || heightDiff > threshold) {
        // Also check if window is docked (more reliable indicator)
        const isDocked = widthDiff > 500 || heightDiff > 300;
        
        if (isDocked) {
          consecutiveDetections++;
          
          // Only trigger after 3 consecutive detections (1.5 seconds)
          if (consecutiveDetections >= 3 && !devtools.open) {
            devtools.open = true;
            handleViolation('devTools');
          }
        }
      } else {
        consecutiveDetections = 0;
        devtools.open = false;
      }
    };

    checkInterval = setInterval(checkDevTools, 500);

    return () => clearInterval(checkInterval);
  }, [detectDevTools, handleViolation]);

  // Disable text selection
  useEffect(() => {
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if target is an HTMLElement and has closest method
      if (target && target.tagName) {
        if (target.tagName === 'VIDEO' || (target.closest && target.closest('video'))) {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener('selectstart', handleSelectStart);
    return () => document.removeEventListener('selectstart', handleSelectStart);
  }, []);

  // Disable drag
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'VIDEO' || target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    return () => document.removeEventListener('dragstart', handleDragStart);
  }, []);

  // Keyboard shortcuts protection (only for actual dev tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only prevent F12 and dev tools shortcuts
      if (e.keyCode === 123) {
        e.preventDefault();
        handleViolation('f12');
        return false;
      }
      
      // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (dev tools)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        handleViolation('devToolsShortcut');
        return false;
      }
      
      // Allow Ctrl+S and other normal shortcuts
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleViolation]);

  // Print protection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          display: none !important;
        }
        body:after {
          content: "${customMessage}";
          display: block !important;
          font-size: 20px;
          text-align: center;
          margin-top: 50%;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [customMessage]);

  // Removed visibility change detection for better UX
  // Removed console warnings for better UX

  return {
    // Can return methods if needed
  };
}