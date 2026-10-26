import React from 'react';

/**
 * Tactical Skeleton Loader with linear shimmer sweep.
 * Replaces spinners for cards, tables, charts, and text.
 */
export default function SkeletonLoader({ 
  variant = 'card', 
  rows = 5, 
  height = 'h-24', 
  className = '' 
}) {
  if (variant === 'card') {
    return (
      <div className={`p-4 bg-navy-card/60 border border-navy-border/60 rounded-lg space-y-3 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-28 skeleton-shimmer" />
          <div className="h-4 w-4 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-8 w-20 skeleton-shimmer my-2" />
        <div className="h-2.5 w-36 skeleton-shimmer" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`w-full bg-navy-sidebar border border-navy-border/60 rounded-lg overflow-hidden p-4 space-y-3 ${className}`}>
        <div className="h-6 w-full skeleton-shimmer opacity-80 mb-2" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center space-x-3 py-1.5">
            <div className="h-4 w-1/4 skeleton-shimmer" />
            <div className="h-4 w-1/6 skeleton-shimmer" />
            <div className="h-4 w-1/6 skeleton-shimmer" />
            <div className="h-4 w-1/5 skeleton-shimmer" />
            <div className="h-4 w-1/6 skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`w-full bg-navy-sidebar border border-navy-border/60 rounded-lg p-4 flex flex-col justify-between ${height} ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="h-3.5 w-32 skeleton-shimmer" />
          <div className="h-3 w-16 skeleton-shimmer" />
        </div>
        <div className="flex items-end space-x-2 h-32 w-full pt-4">
          {[45, 70, 30, 85, 60, 40, 95, 50, 75, 35, 80, 65].map((pct, idx) => (
            <div 
              key={idx} 
              className="flex-1 skeleton-shimmer rounded-t"
              style={{ height: `${pct}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-2 border-t border-navy-border/40">
          <div className="h-2 w-12 skeleton-shimmer" />
          <div className="h-2 w-12 skeleton-shimmer" />
          <div className="h-2 w-12 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  // text or custom line variant
  return (
    <div className={`skeleton-shimmer ${height} rounded ${className}`} />
  );
}
