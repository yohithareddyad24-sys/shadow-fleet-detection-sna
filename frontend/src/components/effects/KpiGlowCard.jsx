import React, { useRef, useCallback } from 'react';

/**
 * Interactive KPI Card with:
 * - 1px border #243249
 * - on hover, border brightens to accent and a soft glow appears
 * - cursor-following radial highlight updated via throttled onMouseMove
 */
export default function KpiGlowCard({ 
  children, 
  className = '', 
  onClick,
  accentColor = '#20D5E8'
}) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cardRef.current) {
      cardRef.current.style.setProperty('--mouse-x', `50%`);
      cardRef.current.style.setProperty('--mouse-y', `50%`);
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`kpi-radial-highlight rounded-lg p-3.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="relative z-10 flex flex-col justify-between h-full">
        {children}
      </div>
    </div>
  );
}
