import React from 'react';
import { Radar } from 'lucide-react';

export default function LoadingSpinner({ message = "Querying Maritime Intelligence Engine...", size = "md" }) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 font-mono text-accent-cyan" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center">
        <div className={`${sizeMap[size] || sizeMap.md} rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan animate-spin`} />
        <Radar className="w-4 h-4 text-accent-cyan absolute animate-pulse" />
      </div>
      <span className="text-xs uppercase tracking-wider text-text-secondary animate-pulse text-center">
        {message}
      </span>
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}
