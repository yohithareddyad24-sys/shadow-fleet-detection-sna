import React from 'react';

/**
 * Tactical status dot with soft breathing pulse.
 * Modes:
 * - live / fresh = #39D98A (green)
 * - stale = #F5B942 (amber)
 * - down = #FF5C65 (red)
 * - demo = #64748B (grey)
 */
export default function StatusDot({ 
  status = 'live', 
  label = '', 
  className = '',
  size = 'md' 
}) {
  const normalizedStatus = String(status).toLowerCase();

  let dotClass = 'status-dot-live';
  let dotColor = '#39D98A';
  let defaultLabel = 'LIVE';

  if (normalizedStatus === 'stale' || normalizedStatus === 'warning') {
    dotClass = 'status-dot-stale';
    dotColor = '#F5B942';
    defaultLabel = 'STALE';
  } else if (normalizedStatus === 'down' || normalizedStatus === 'critical' || normalizedStatus === 'alert') {
    dotClass = 'status-dot-down';
    dotColor = '#FF5C65';
    defaultLabel = 'DOWN';
  } else if (normalizedStatus === 'demo' || normalizedStatus === 'cached') {
    dotClass = 'status-dot-demo';
    dotColor = '#64748B';
    defaultLabel = 'DEMO';
  }

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size] || 'w-2 h-2';

  const textToDisplay = label || defaultLabel;

  return (
    <span className={`inline-flex items-center space-x-1.5 ${className}`}>
      <span 
        className={`rounded-full shrink-0 ${sizeClasses} ${dotClass}`} 
        aria-hidden="true" 
      />
      {textToDisplay && (
        <span 
          className="text-[10px] font-mono tracking-wider font-semibold uppercase"
          style={{ color: dotColor }}
        >
          {textToDisplay}
        </span>
      )}
    </span>
  );
}
