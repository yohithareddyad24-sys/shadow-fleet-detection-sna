/**
 * Hook for observing container resizes to invalidate map bounds and trigger chart recalculation.
 */

import { useEffect, useRef, useState } from 'react';

export function useResizeObserver(callback) {
  const elementRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      if (callback) {
        callback({ width, height });
      }
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [callback]);

  return [elementRef, dimensions];
}
