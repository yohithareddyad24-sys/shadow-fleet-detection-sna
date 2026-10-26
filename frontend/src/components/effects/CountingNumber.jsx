import React, { useEffect, useState, useRef } from 'react';

/**
 * KPI numbers count up on load and on data change (easing, <=800ms, tabular-nums).
 */
export default function CountingNumber({ 
  value = 0, 
  duration = 750, 
  decimals = 0, 
  prefix = '', 
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // Check reduced motion preference or body class
    const isReduced = 
      document.body.classList.contains('reduce-effects') || 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      setDisplayValue(Number(value));
      prevValueRef.current = Number(value);
      return;
    }

    const startVal = prevValueRef.current;
    const targetVal = Number(value) || 0;
    const startTime = performance.now();

    // Standard cubic ease-out
    const easeOutCubic = (t) => (--t) * t * t + 1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startVal + (targetVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
