import React from 'react';
import { Search, Download, Filter } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';

export default function VesselFilterBar({ 
  search, 
  setSearch, 
  tierFilter, 
  setTierFilter, 
  flagFilter, 
  setFlagFilter, 
  flags = [], 
  typeFilter, 
  setTypeFilter, 
  types = [], 
  onExportCsv,
  totalCount = 0,
  isDemo = false 
}) {
  return (
    <div className="bg-navy-sidebar border border-navy-border rounded-lg p-3 shadow-panel flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vessel, MMSI, IMO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-navy-card border border-navy-border rounded text-xs text-white placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan"
            aria-label="Filter vessels by keyword"
          />
        </div>

        {/* Tier Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-secondary text-[11px]">TIER:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan"
            aria-label="Filter by Risk Tier"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL_MONITORING">Critical Monitoring</option>
            <option value="ELEVATED_ATTENTION">Elevated Attention</option>
            <option value="MODERATE_INTERACTION">Moderate Interaction</option>
            <option value="BASELINE_LEGITIMATE">Baseline Legitimate</option>
          </select>
        </div>

        {/* Flag Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-secondary text-[11px]">FLAG:</span>
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan"
            aria-label="Filter by Flag"
          >
            <option value="ALL">All Flags</option>
            {flags.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-secondary text-[11px]">TYPE:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan"
            aria-label="Filter by Vessel Type"
          >
            <option value="ALL">All Vessel Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {isDemo && <DemoBadge />}
        <span className="text-text-secondary text-[11px]">
          Target Pool: <strong className="text-accent-cyan">{totalCount}</strong>
        </span>
        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan"
            title="Download CSV records"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
