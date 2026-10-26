import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Shield } from 'lucide-react';
import { getTierColor } from '../../utils/formatters';

export default function VesselRiskBadge({ tier = 'BASELINE_LEGITIMATE', score }) {
  const styles = getTierColor(tier);

  const getIcon = () => {
    switch (tier) {
      case 'CRITICAL_MONITORING': return <ShieldAlert className="w-3 h-3 text-risk-alert" />;
      case 'ELEVATED_ATTENTION': return <AlertTriangle className="w-3 h-3 text-risk-warning" />;
      case 'MODERATE_INTERACTION': return <Shield className="w-3 h-3 text-accent-cyan" />;
      default: return <ShieldCheck className="w-3 h-3 text-risk-success" />;
    }
  };

  const label = tier.replace(/_/g, ' ');

  let glowClass = '';
  if (tier === 'CRITICAL_MONITORING') glowClass = 'glow-alert';
  else if (tier === 'ELEVATED_ATTENTION') glowClass = 'glow-warning';
  else if (tier === 'MODERATE_INTERACTION') glowClass = 'glow-cyan';

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${styles.badge} ${glowClass}`}>
      {getIcon()}
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-90 font-normal">
          ({Math.round(Number(score) * 100)}%)
        </span>
      )}
    </span>
  );
}
