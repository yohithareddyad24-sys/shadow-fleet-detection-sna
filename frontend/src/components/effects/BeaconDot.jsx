import React from 'react';

export default function BeaconDot({ active = true, statusText = "LIVE", className = "" }) {
  return (
    <span className={`inline-flex items-center space-x-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="animate-ping-radar absolute inline-flex h-full w-full rounded-full bg-risk-success opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-risk-success' : 'bg-risk-warning'}`} />
      </span>
      {statusText && (
        <span className="text-[10px] font-mono tracking-wider font-semibold text-text-secondary uppercase">
          {statusText}
        </span>
      )}
    </span>
  );
}
