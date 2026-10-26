import React from 'react';
import { Database, Info } from 'lucide-react';

/**
 * Prominent Badge displayed whenever data originates from the demo adapter
 * rather than live backend API endpoints.
 */
export default function DemoBadge({ 
  label = "DEMO DATA", 
  tooltip = "Synthetic illustrative demonstration data used because backend endpoint is offline or simulated.", 
  className = "" 
}) {
  return (
    <span 
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-warning/15 text-risk-warning border border-risk-warning/40 shadow-sm cursor-help ${className}`}
      title={tooltip}
    >
      <Database className="w-3 h-3 text-risk-warning" />
      <span>{label}</span>
    </span>
  );
}
