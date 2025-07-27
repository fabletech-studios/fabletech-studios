import { useEffect, useRef, useState } from 'react';

interface GestureHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: (side: 'left' | 'right') => void;
  onPinch?: (scale: number) => void;
}

export function useVideoGestures(
  containerRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      } else if (e.touches.length === 2) {
        // Pinch gesture start
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        // Handle pinch
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = distance / pinchStartRef.current;
        if (handlers.onPinch) {
          handlers.onPinch(scale);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const deltaTime = touchEnd.time - touchStartRef.current.time;

      // Check for double tap
      if (deltaTime < 300 && Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
        if (lastTapRef.current && touchEnd.time - lastTapRef.current.time < 300) {
          // Double tap detected
          const containerRect = container.getBoundingClientRect();
          const side = touchEnd.x < containerRect.width / 2 ? 'left' : 'right';
          if (handlers.onDoubleTap) {
            handlers.onDoubleTap(side);
          }
          lastTapRef.current = null;
        } else {
          lastTapRef.current = touchEnd;
        }
      } else if (deltaTime < 300) {
        // Swipe detection
        const threshold = 50;
        const restraint = 100;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaY) < restraint) {
            if (deltaX > threshold && handlers.onSwipeRight) {
              handlers.onSwipeRight();
            } else if (deltaX < -threshold && handlers.onSwipeLeft) {
              handlers.onSwipeLeft();
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaX) < restraint) {
            if (deltaY > threshold && handlers.onSwipeDown) {
              handlers.onSwipeDown();
            } else if (deltaY < -threshold && handlers.onSwipeUp) {
              handlers.onSwipeUp();
            }
          }
        }
      }

      touchStartRef.current = null;
      pinchStartRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handlers]);

  return {
    // Return any state if needed
  };
}