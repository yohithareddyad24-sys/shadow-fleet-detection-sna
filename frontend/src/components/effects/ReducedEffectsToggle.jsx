import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Zap } from 'lucide-react';

/**
 * Global "Reduce effects" toggle button with localStorage persistence.
 * Respects system prefers-reduced-motion and adds/removes .reduce-effects to <body>.
 */
export default function ReducedEffectsToggle({ className = '' }) {
  const [reduceEffects, setReduceEffects] = useState(() => {
    const saved = localStorage.getItem('shadow_fleet_reduce_effects');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (reduceEffects) {
      document.body.classList.add('reduce-effects');
    } else {
      document.body.classList.remove('reduce-effects');
    }
    localStorage.setItem('shadow_fleet_reduce_effects', String(reduceEffects));
  }, [reduceEffects]);

  const toggle = () => {
    setReduceEffects(prev => !prev);
  };

  return (
    <button
      onClick={toggle}
      title={reduceEffects ? "Enable full tactical animations" : "Reduce animations & visual effects"}
      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs font-mono transition-colors ${
        reduceEffects ? 'text-risk-warning border-risk-warning/40' : 'text-text-secondary hover:text-accent-cyan'
      } ${className}`}
    >
      <Zap className={`w-3.5 h-3.5 ${reduceEffects ? 'text-risk-warning' : 'text-accent-cyan'}`} />
      <span className="hidden sm:inline">
        {reduceEffects ? 'Effects: Minimal' : 'Effects: Full'}
      </span>
    </button>
  );
}
