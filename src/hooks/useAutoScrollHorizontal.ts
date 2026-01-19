import { useEffect, useRef } from 'react';

export const useAutoScrollHorizontal = (scrollContainerRef: React.RefObject<HTMLElement>) => {
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const mousePosRef = useRef({ x: 0 });

  const setIsDragging = (dragging: boolean) => {
    isDraggingRef.current = dragging;
    if (!dragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    } else {
      startAutoScroll();
    }
  };

  const startAutoScroll = () => {
    const scroll = () => {
      if (!isDraggingRef.current || !scrollContainerRef.current) {
         animationFrameRef.current = undefined;
         return;
      }

      const container = scrollContainerRef.current;
      const { left, right } = container.getBoundingClientRect();
      const { x } = mousePosRef.current;

      // Configuration
      const threshold = 120; // Distance pixels from edge to start scrolling
      const maxSpeed = 20; // Max pixels per frame
      
      // Logic
      let scrollAmount = 0;
      
      // Left Edge
      if (x < left + threshold) {
         const intensity = 1 - Math.max(0, (x - left) / threshold);
         scrollAmount = -1 * maxSpeed * intensity;
      }
      // Right Edge
      else if (x > right - threshold) {
         const intensity = 1 - Math.max(0, (right - x) / threshold);
         scrollAmount = maxSpeed * intensity;
      }

      if (scrollAmount !== 0) {
        container.scrollLeft += scrollAmount;
      }

      animationFrameRef.current = requestAnimationFrame(scroll);
    };
    
    // Start the loop if not running
    if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(scroll);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX };
    };
    
    // Also handle touch for mobile if needed, but drag usually is mouse/touch specific
    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches[0]) {
            mousePosRef.current = { x: e.touches[0].clientX };
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return { setIsDragging };
};
