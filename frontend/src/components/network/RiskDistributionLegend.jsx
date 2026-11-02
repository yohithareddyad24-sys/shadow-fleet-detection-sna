import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';

export default function RiskDistributionLegend({ counts = {}, selectedCategory, onSelectCategory }) {
  const categories = [
    {
      id: 'CRITICAL',
      label: 'Critical',
      symbol: '!',
      color: '#FF5C65',
      badgeClass: 'bg-risk-alert/20 text-risk-alert border-risk-alert/40',
      icon: AlertCircle,
      count: counts.CRITICAL || 2,
    },
    {
      id: 'HIGH',
      label: 'High',
      symbol: '▲',
      color: '#FF9900',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      icon: ShieldAlert,
      count: counts.HIGH || 3,
    },
    {
      id: 'MEDIUM',
      label: 'Medium',
      symbol: '●',
      color: '#F5B942',
      badgeClass: 'bg-risk-warning/20 text-risk-warning border-risk-warning/40',
      icon: AlertTriangle,
      count: counts.MEDIUM || 4,
    },
    {
      id: 'LOW',
      label: 'Low',
      symbol: '✓',
      color: '#39D98A',
      badgeClass: 'bg-risk-success/20 text-risk-success border-risk-success/40',
      icon: CheckCircle2,
      count: counts.LOW || 2,
    },
    {
      id: 'UNKNOWN',
      label: 'Unknown / Insufficient AIS',
      symbol: '?',
      color: '#94A3B8',
      badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      icon: HelpCircle,
      count: counts.UNKNOWN || 1,
    },
  ];

  return (
    <div className="glass-panel rounded-lg p-3 shadow-panel font-mono text-xs space-y-2 select-none border border-navy-border/80">
      
      {/* Legend Title */}
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
        <span className="font-bold text-white text-[11px] uppercase tracking-wider">
          Risk Classification & Topology Legend
        </span>
        <span className="text-[10px] text-text-secondary">5 Tiers</span>
      </div>

      {/* 5-Color Risk Distribution Grid with Symbols & Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'ALL' : cat.id)}
              className={`flex items-center justify-between p-1.5 rounded border transition-all text-left ${
                isSelected 
                  ? 'bg-navy-elevated border-accent-cyan shadow-sm' 
                  : 'bg-navy-card/80 border-navy-border hover:bg-navy-card hover:border-navy-border/90'
              }`}
              title={`Filter graph by ${cat.label} anomaly category`}
            >
              <div className="flex items-center space-x-1.5 truncate">
                <span 
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" 
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color, border: `1.5px solid ${cat.color}` }}
                >
                  {cat.symbol}
                </span>
                <span className="text-[10px] text-text-secondary truncate">{cat.label}</span>
              </div>
              <span className="text-white font-bold text-xs ml-1 font-mono">{cat.count}</span>
            </button>
          );
        })}
      </div>

      {/* Edge Types Legend */}
      <div className="pt-1.5 border-t border-navy-border/60 flex flex-wrap items-center gap-3 text-[10px] text-text-secondary">
        <span className="text-white font-bold">Edge Types:</span>
        <span className="flex items-center space-x-1">
          <span className="w-3 h-0.5 bg-accent-cyan inline-block" />
          <span>Documented Link</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-3 h-0.5 bg-risk-alert inline-block" />
          <span>High-Risk STS</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-3 h-0.5 bg-risk-warning inline-block" />
          <span>Repeated Rendezvous</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-3 h-0.5 border-b border-dashed border-risk-warning inline-block" />
          <span className="text-risk-warning">Dashed = Unverified Proximity</span>
        </span>
      </div>

      {/* Mandatory Permanent Note */}
      <div className="pt-1 border-t border-navy-border/60 text-[10px] text-text-secondary/90 leading-tight">
        <span className="text-risk-warning font-semibold">Note: </span>
        <span>Colour shows analytical anomaly level, not confirmed illegal activity.</span>
      </div>

    </div>
  );
}
