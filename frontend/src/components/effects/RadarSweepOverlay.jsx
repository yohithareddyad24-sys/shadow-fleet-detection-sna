import React from 'react';

/**
 * Radar Sweep Overlay for tactical maps.
 * - Slow radar-sweep overlay (conic-gradient rotating, low opacity, pointer-events none)
 * - Faint range rings and tactical crosshairs
 * - Toggleable
 */
export default function RadarSweepOverlay({ active = true, showRings = true }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Concentric Range Rings */}
      {showRings && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[85vmin] h-[85vmin] rounded-full border border-accent-cyan/40" />
          <div className="absolute w-[60vmin] h-[60vmin] rounded-full border border-accent-cyan/35" />
          <div className="absolute w-[35vmin] h-[35vmin] rounded-full border border-accent-cyan/30" />
          <div className="absolute w-[15vmin] h-[15vmin] rounded-full border border-accent-cyan/25" />
          
          {/* Tactical Crosshair Axes */}
          <div className="absolute w-full h-[1px] bg-accent-cyan/20" />
          <div className="absolute h-full w-[1px] bg-accent-cyan/20" />

          {/* Heading cardinal labels */}
          <span className="absolute top-2 font-mono text-[9px] text-accent-cyan/50 tracking-widest">000° N</span>
          <span className="absolute right-2 font-mono text-[9px] text-accent-cyan/50 tracking-widest">090° E</span>
          <span className="absolute bottom-2 font-mono text-[9px] text-accent-cyan/50 tracking-widest">180° S</span>
          <span className="absolute left-2 font-mono text-[9px] text-accent-cyan/50 tracking-widest">270° W</span>
        </div>
      )}

      {/* Rotating Conic Gradient Beam */}
      <div className="radar-sweep-cone opacity-25" />
    </div>
  );
}
