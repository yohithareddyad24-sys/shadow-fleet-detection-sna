import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  MapPin, 
  Share2, 
  GitBranch, 
  ExternalLink,
  ShieldAlert,
  Radio,
  Anchor,
  FileSpreadsheet
} from 'lucide-react';

import Sparkline from '../components/effects/Sparkline';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function FleetTableView({ 
  vessels = [], 
  onSelectVessel, 
  onLocateOnMap, 
  onViewInGraph, 
  onRunAcoFromVessel 
}) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('composite_risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Distinct flags & types for filter dropdowns
  const flags = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.flag))].sort(), [vessels]);
  const types = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.vessel_type))].sort(), [vessels]);

  // Filtering & Sorting
  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      const matchSearch = 
        v.vessel_name.toLowerCase().includes(search.toLowerCase()) ||
        v.mmsi.includes(search) ||
        (v.imo && v.imo.includes(search)) ||
        v.flag.toLowerCase().includes(search.toLowerCase());

      const matchTier = tierFilter === 'ALL' || v.risk_tier === tierFilter;
      const matchFlag = flagFilter === 'ALL' || v.flag === flagFilter;
      const matchType = typeFilter === 'ALL' || v.vessel_type === typeFilter;

      return matchSearch && matchTier && matchFlag && matchType;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [vessels, search, tierFilter, flagFilter, typeFilter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'MMSI', 'Vessel Name', 'Flag', 'Type', 'Risk Score', 'Risk Tier',
      'Primary Driver', 'AIS Gaps', 'Spoofing Incidents', 'Degree Centrality', 'Betweenness Centrality'
    ];
    const rows = filteredVessels.map(v => [
      v.mmsi,
      `"${v.vessel_name}"`,
      `"${v.flag}"`,
      `"${v.vessel_type}"`,
      v.composite_risk_score,
      v.risk_tier,
      `"${v.primary_risk_driver}"`,
      v.ais_gap_count,
      v.spoofing_incident_count,
      v.degree_centrality,
      v.betweenness_centrality,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shadow_fleet_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5.6 Severity badges with tiny glow
  const getTierBadge = (tier) => {
    switch (tier) {
      case 'CRITICAL_MONITORING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-alert/20 text-risk-alert border border-risk-alert/40 glow-alert inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-alert animate-ping" />
            <span>CRITICAL</span>
          </span>
        );
      case 'ELEVATED_ATTENTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-warning/20 text-risk-warning border border-risk-warning/40 glow-warning inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-warning" />
            <span>ELEVATED</span>
          </span>
        );
      case 'MODERATE_INTERACTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-blue/20 text-accent-cyan border border-accent-blue/40 glow-cyan">
            MODERATE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-success/20 text-risk-success border border-risk-success/40">
            BASELINE
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-navy-bg p-4 overflow-hidden text-text-primary select-none">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-navy-sidebar border border-navy-border rounded-lg p-3 mb-3 shadow-panel flex flex-wrap items-center justify-between gap-3 text-xs font-mono glass-panel">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, MMSI, IMO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-navy-card border border-navy-border rounded text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-text-secondary text-[11px]">TIER:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="ALL">All Tiers ({vessels.length})</option>
              <option value="CRITICAL_MONITORING">Critical</option>
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
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
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
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-text-secondary text-[11px]">
            Showing <strong className="text-accent-cyan">{filteredVessels.length}</strong> of {vessels.length}
          </span>
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan flex items-center space-x-1.5 transition-colors"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container with HUD Corner Brackets & Glass styling */}
      <HudCornerFrame className="flex-1 bg-navy-sidebar border border-navy-border rounded-lg overflow-hidden flex flex-col shadow-panel glass-panel" glow>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-navy-card/90 text-text-secondary uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-navy-border backdrop-blur-sm">
              <tr>
                <th 
                  onClick={() => handleSort('vessel_name')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Vessel Identifier</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'vessel_name' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('flag')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Flag State</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'flag' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('vessel_type')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'vessel_type' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('composite_risk_score')}
                  className="py-3 px-3 cursor-pointer hover:text-accent-cyan select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Composite Risk</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'composite_risk_score' ? 'text-accent-cyan rotate-180' : 'text-accent-cyan'}`} />
                  </div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">
                  <span>Trend</span>
                </th>
                <th 
                  onClick={() => handleSort('risk_tier')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Alert Tier</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'risk_tier' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('primary_risk_driver')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Primary Driver</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'primary_risk_driver' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('betweenness_centrality')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                  title="Bridge Intermediary Centrality"
                >
                  <div className="flex items-center space-x-1">
                    <span>Betweenness</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'betweenness_centrality' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ais_gap_count')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Dark Gaps</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'ais_gap_count' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('spoofing_incident_count')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Spoofing</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'spoofing_incident_count' ? 'text-accent-cyan rotate-180' : 'text-text-secondary/60'}`} />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Quick Triage</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-navy-border/60">
              {filteredVessels.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-text-secondary">
                    No vessels found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredVessels.map(v => {
                  const riskScore = v.composite_risk_score || 0;
                  const isCritical = v.risk_tier === 'CRITICAL_MONITORING';
                  const sparkColor = riskScore >= 0.65 ? '#FF5C65' : riskScore >= 0.45 ? '#F5B942' : '#20D5E8';

                  return (
                    <tr 
                      key={v.mmsi}
                      className={`hover:bg-navy-card/80 transition-colors group cursor-pointer ${
                        isCritical ? 'border-l-2 border-l-risk-alert row-attention-pulse bg-risk-alert/5' : ''
                      }`}
                      onClick={() => onSelectVessel(v)}
                    >
                      {/* Name & MMSI */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white group-hover:text-accent-cyan transition-colors">
                          {v.vessel_name}
                        </div>
                        <div className="text-[10px] text-text-secondary font-mono">
                          MMSI: {v.mmsi} {v.imo && `• IMO: ${v.imo}`}
                        </div>
                      </td>

                      {/* Flag State */}
                      <td className="py-2.5 px-3">
                        <div className="text-text-primary">{v.flag}</div>
                        <div className="text-[10px] text-text-secondary">
                          Weight: {v.flag_risk_weight.toFixed(2)}
                        </div>
                      </td>

                      {/* Vessel Type */}
                      <td className="py-2.5 px-3 text-text-secondary">
                        {v.vessel_type}
                      </td>

                      {/* Composite Risk Score */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold tabular-nums text-sm ${
                            riskScore >= 0.65 ? 'text-risk-alert' :
                            riskScore >= 0.45 ? 'text-risk-warning' :
                            riskScore >= 0.25 ? 'text-accent-cyan' : 'text-risk-success'
                          }`}>
                            {riskScore.toFixed(4)}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            ({Math.round(riskScore * 100)}%)
                          </span>
                        </div>
                      </td>

                      {/* 5.4 Sparkline inside table rows */}
                      <td className="py-2.5 px-2 text-center">
                        <Sparkline 
                          data={[
                            Math.max((v.speed || 10) * 0.7, 1),
                            Math.max((v.speed || 10) * 0.9, 1),
                            Math.max((v.speed || 10) * 1.1, 1),
                            Math.max((v.speed || 10) * 0.6, 0.5),
                            Math.max(v.speed || 10, 1)
                          ]} 
                          color={sparkColor} 
                          width={55} 
                          height={16} 
                        />
                      </td>

                      {/* Tier Badge with glow */}
                      <td className="py-2.5 px-3">
                        {getTierBadge(v.risk_tier)}
                      </td>

                      {/* Primary Driver */}
                      <td className="py-2.5 px-3 text-[11px] text-text-secondary">
                        {v.primary_risk_driver}
                      </td>

                      {/* Betweenness Centrality */}
                      <td className="py-2.5 px-3">
                        <span className={`font-mono tabular-nums ${v.betweenness_centrality > 0.15 ? 'text-accent-cyan font-bold' : 'text-text-secondary'}`}>
                          {v.betweenness_centrality.toFixed(4)}
                        </span>
                      </td>

                      {/* Dark AIS Gaps */}
                      <td className="py-2.5 px-3">
                        <span className={`font-bold tabular-nums ${v.ais_gap_count > 5 ? 'text-risk-warning' : 'text-text-secondary'}`}>
                          {v.ais_gap_count}
                        </span>
                      </td>

                      {/* Spoofing Discrepancies */}
                      <td className="py-2.5 px-3">
                        <span className={`font-bold tabular-nums ${v.spoofing_incident_count > 0 ? 'text-risk-alert' : 'text-text-secondary'}`}>
                          {v.spoofing_incident_count}
                        </span>
                      </td>

                      {/* 5.6 Row hover reveals quick actions */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => onLocateOnMap(v)}
                            title="Focus on Tactical Map"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onViewInGraph(v)}
                            title="Inspect in SNA Topology"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-blue transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRunAcoFromVessel(v)}
                            title="Set as ACO Origin"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-navy-card/90 border-t border-navy-border px-4 py-2 text-[11px] font-mono text-text-secondary flex items-center justify-between">
          <div>
            Data Source: <span className="text-white">Synthetic AIS & Encounter Logs (Member 3 SNA Engine)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Score formula: w_deg(20%) + w_bet(30%) + w_flag(25%) + w_gap(15%) + w_spf(10%)</span>
          </div>
        </div>
      </HudCornerFrame>
    </div>
  );
}
