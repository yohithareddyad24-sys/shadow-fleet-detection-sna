import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
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
  FileSpreadsheet,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

import Sparkline from '../components/effects/Sparkline';
import HudCornerFrame from '../components/effects/HudCornerFrame';
import DemoBadge from '../components/common/DemoBadge';

export default function FleetTableView({ 
  vessels: propVessels, 
  onSelectVessel: propOnSelectVessel, 
  onLocateOnMap, 
  onViewInGraph, 
  onRunAcoFromVessel 
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};

  const vessels = propVessels || outletCtx.allVessels || [];
  const onSelectVessel = propOnSelectVessel || outletCtx.onSelectVessel;
  const isDemo = outletCtx.isDemoMode || false;

  // Filter States
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [gapFilter, setGapFilter] = useState('ALL'); // 'ALL', 'WITH_GAPS', 'NO_GAPS'
  const [encounterFilter, setEncounterFilter] = useState('ALL'); // 'ALL', 'WITH_ENCOUNTER'

  // Sorting
  const [sortField, setSortField] = useState('composite_risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(rawSearch);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [rawSearch]);

  // Synchronize URL parameters if present (e.g. ?tier=CRITICAL_MONITORING or ?tier=ANOMALOUS)
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (tierParam) {
      if (tierParam === 'ANOMALOUS') {
        // Special case for all anomalous
        setTierFilter('ANOMALOUS');
      } else {
        setTierFilter(tierParam);
      }
    }
  }, [searchParams]);

  // Distinct flags & types for filter dropdowns
  const flags = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.flag))].sort(), [vessels]);
  const types = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.vessel_type))].sort(), [vessels]);

  // Filtering & Sorting
  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      const matchSearch = 
        v.vessel_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        v.mmsi.includes(debouncedSearch) ||
        (v.imo && String(v.imo).includes(debouncedSearch)) ||
        v.flag.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchTier = true;
      if (tierFilter === 'ANOMALOUS') {
        matchTier = v.risk_tier === 'CRITICAL_MONITORING' || v.risk_tier === 'ELEVATED_ATTENTION';
      } else if (tierFilter !== 'ALL') {
        matchTier = v.risk_tier === tierFilter;
      }

      const matchFlag = flagFilter === 'ALL' || v.flag === flagFilter;
      const matchType = typeFilter === 'ALL' || v.vessel_type === typeFilter;
      
      const matchGap = 
        gapFilter === 'ALL' ? true :
        gapFilter === 'WITH_GAPS' ? (v.ais_gap_count || 0) > 0 :
        (v.ais_gap_count || 0) === 0;

      const matchEncounter = 
        encounterFilter === 'ALL' ? true :
        (v.degree_centrality || 0) > 0;

      return matchSearch && matchTier && matchFlag && matchType && matchGap && matchEncounter;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [vessels, debouncedSearch, tierFilter, flagFilter, typeFilter, gapFilter, encounterFilter, sortField, sortAsc]);

  // Paginated slice
  const totalItems = filteredVessels.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedVessels = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVessels.slice(start, start + pageSize);
  }, [filteredVessels, page, pageSize]);

  const hasActiveFilters = rawSearch || tierFilter !== 'ALL' || flagFilter !== 'ALL' || typeFilter !== 'ALL' || gapFilter !== 'ALL' || encounterFilter !== 'ALL';

  const clearAllFilters = () => {
    setRawSearch('');
    setDebouncedSearch('');
    setTierFilter('ALL');
    setFlagFilter('ALL');
    setTypeFilter('ALL');
    setGapFilter('ALL');
    setEncounterFilter('ALL');
    setPage(1);
    setSearchParams({});
  };

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
      'MMSI', 'IMO', 'Vessel Name', 'Flag', 'Type', 'Last Position', 'Risk Score', 'Risk Tier',
      'Primary Driver', 'AIS Gaps', 'Spoofing Incidents', 'Degree Centrality', 'Betweenness Centrality'
    ];
    const rows = filteredVessels.map(v => [
      v.mmsi,
      v.imo || '',
      `"${v.vessel_name}"`,
      `"${v.flag}"`,
      `"${v.vessel_type}"`,
      `"${v.lat?.toFixed(2)}N, ${v.lng?.toFixed(2)}E"`,
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

  // Detected events badges for vessel row
  const renderDetectedEvents = (v) => {
    const badges = [];
    if (v.ais_gap_count > 0) {
      badges.push(
        <span key="gap" className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-risk-alert/20 text-risk-alert border border-risk-alert/30" title={`${v.ais_gap_count} AIS Gaps`}>
          AIS GAP ({v.ais_gap_count})
        </span>
      );
    }
    if (v.degree_centrality > 0.2 || v.status === 'STS_OPERATION') {
      badges.push(
        <span key="sts" className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-risk-warning/20 text-risk-warning border border-risk-warning/30" title="Ship-to-ship encounter">
          STS RENDEZVOUS
        </span>
      );
    }
    if (v.spoofing_incident_count > 0) {
      badges.push(
        <span key="spf" className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-accent-blue/20 text-accent-cyan border border-accent-blue/30" title="Kinematic spoofing">
          SPOOFING
        </span>
      );
    }
    if (v.status === 'LOITERING') {
      badges.push(
        <span key="loiter" className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-navy-elevated text-text-secondary border border-navy-border" title="Loitering holding pattern">
          LOITERING
        </span>
      );
    }

    if (badges.length === 0) {
      return <span className="text-[10px] text-text-secondary/60">Nominal</span>;
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  // Investigation status badge
  const renderInvestigationStatus = (v) => {
    if (v.risk_tier === 'CRITICAL_MONITORING') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-alert/15 text-risk-alert border border-risk-alert/40 flex items-center space-x-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-alert animate-ping" />
          <span>ACTIVE REVIEW</span>
        </span>
      );
    }
    if (v.risk_tier === 'ELEVATED_ATTENTION') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-warning/15 text-risk-warning border border-risk-warning/40 flex items-center space-x-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-warning" />
          <span>TRIAGE PENDING</span>
        </span>
      );
    }
    if (v.risk_tier === 'MODERATE_INTERACTION') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-blue/15 text-accent-cyan border border-accent-blue/40 shrink-0">
          MONITORED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-success/15 text-risk-success border border-risk-success/40 shrink-0">
        BASELINE
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-navy-bg p-4 overflow-hidden text-text-primary select-none space-y-3 font-mono">
      
      {/* 1. Top Filter & Action Bar */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-3 shadow-panel flex flex-wrap items-center justify-between gap-3 text-xs glass-panel">
        
        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Debounced Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, MMSI, IMO, Flag..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-navy-card border border-navy-border rounded text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            />
            {rawSearch && (
              <button
                onClick={() => setRawSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-text-secondary text-[11px]">TIER:</span>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="ALL">All Categories</option>
              <option value="ANOMALOUS">All Anomalies (Elevated + Critical)</option>
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
              onChange={(e) => {
                setFlagFilter(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* AIS Gap Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-text-secondary text-[11px]">GAPS:</span>
            <select
              value={gapFilter}
              onChange={(e) => {
                setGapFilter(e.target.value);
                setPage(1);
              }}
              className="bg-navy-card border border-navy-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="ALL">All AIS States</option>
              <option value="WITH_GAPS">Has Dark AIS Gaps</option>
              <option value="NO_GAPS">Continuous AIS Only</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-risk-warning hover:text-white flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Counter & CSV Export */}
        <div className="flex items-center space-x-3">
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
      </HudCornerFrame>

      {/* 2. Main Modern Table Container */}
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
                  onClick={() => handleSort('mmsi')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span>MMSI</span>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">
                  <span>IMO</span>
                </th>
                <th 
                  onClick={() => handleSort('vessel_type')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span>Type</span>
                </th>
                <th 
                  onClick={() => handleSort('flag')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span>Flag</span>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">
                  <span>Last Position</span>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">
                  <span>Last AIS Update</span>
                </th>
                <th 
                  onClick={() => handleSort('composite_risk_score')}
                  className="py-3 px-3 cursor-pointer hover:text-accent-cyan select-none whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Anomaly Score</span>
                    <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'composite_risk_score' ? 'text-accent-cyan rotate-180' : 'text-accent-cyan'}`} />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">
                  <span>Detected Events</span>
                </th>
                <th 
                  onClick={() => handleSort('risk_tier')}
                  className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <span>Status</span>
                </th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-navy-border/60">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="h-6 skeleton-shimmer" />
                      <div className="h-6 skeleton-shimmer" />
                      <div className="h-6 skeleton-shimmer" />
                      <div className="h-6 skeleton-shimmer" />
                    </div>
                  </td>
                </tr>
              ) : paginatedVessels.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-risk-warning" />
                      <div className="text-sm font-bold text-white">No vessels match active filters.</div>
                      <p className="text-xs max-w-sm text-text-secondary">
                        Try modifying or clearing your search term, risk tier, or flag filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="px-3 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan font-bold"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVessels.map(v => {
                  const score = v.composite_risk_score || 0;
                  const isCritical = v.risk_tier === 'CRITICAL_MONITORING';
                  const scoreColor = score >= 0.65 ? '#FF5C65' : score >= 0.45 ? '#F5B942' : '#00D4FF';

                  return (
                    <tr 
                      key={v.mmsi}
                      className={`hover:bg-navy-card/80 transition-colors group cursor-pointer ${
                        isCritical ? 'border-l-2 border-l-risk-alert bg-risk-alert/5' : ''
                      }`}
                      onClick={() => onSelectVessel(v)}
                    >
                      {/* Name & Subtext */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white group-hover:text-accent-cyan transition-colors">
                          {v.vessel_name}
                        </div>
                        <div className="text-[10px] text-text-secondary font-mono">
                          {v.registered_owner || 'Registered Owner SPV'}
                        </div>
                      </td>

                      {/* MMSI */}
                      <td className="py-2.5 px-3 font-mono text-text-primary">
                        {v.mmsi}
                      </td>

                      {/* IMO */}
                      <td className="py-2.5 px-3 font-mono text-text-secondary">
                        {v.imo || `9${v.mmsi.slice(-6)}`}
                      </td>

                      {/* Vessel Type */}
                      <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                        {v.vessel_type}
                      </td>

                      {/* Flag State */}
                      <td className="py-2.5 px-3">
                        <div className="text-text-primary font-medium">{v.flag}</div>
                        <div className="text-[10px] text-text-secondary">
                          Wt: {v.flag_risk_weight?.toFixed(2) ?? '0.00'}
                        </div>
                      </td>

                      {/* Last Position */}
                      <td className="py-2.5 px-3 text-text-secondary text-[11px] whitespace-nowrap">
                        <div>{v.lat?.toFixed(2)}°N, {v.lng?.toFixed(2)}°E</div>
                        <div className="text-[10px] text-accent-cyan/80">{v.port || 'Offshore Transit'}</div>
                      </td>

                      {/* Last AIS Update */}
                      <td className="py-2.5 px-3 text-[11px] text-text-secondary whitespace-nowrap">
                        {v.eta || 'Recent UTC'}
                      </td>

                      {/* Anomaly Score (with Mini Bar) */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-navy-card h-2 rounded-full overflow-hidden border border-navy-border">
                            <div 
                              className="h-full rounded-full transition-all duration-300" 
                              style={{ width: `${Math.round(score * 100)}%`, backgroundColor: scoreColor }}
                            />
                          </div>
                          <span className="font-bold text-xs tabular-nums" style={{ color: scoreColor }}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Detected Events */}
                      <td className="py-2.5 px-3">
                        {renderDetectedEvents(v)}
                      </td>

                      {/* Investigation Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderInvestigationStatus(v)}
                      </td>

                      {/* Quick Triage Actions */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              if (onLocateOnMap) onLocateOnMap(v);
                              else navigate('/map');
                            }}
                            title="Focus on Maritime Map"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (onViewInGraph) onViewInGraph(v);
                              else navigate('/network');
                            }}
                            title="Inspect in SNA Topology"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-blue transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectVessel(v)}
                            title="Open Intelligence Dossier"
                            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-accent-cyan font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* 3. Table Pagination & Footer */}
        <div className="bg-navy-card/90 border-t border-navy-border px-4 py-2 text-xs font-mono text-text-secondary flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span>
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-text-secondary text-[11px]">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-navy-card border border-navy-border rounded px-2 py-0.5 text-xs text-text-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white disabled:opacity-40 disabled:hover:text-text-secondary transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pNum => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                  page === pNum
                    ? 'bg-accent-cyan text-navy-bg border-accent-cyan'
                    : 'bg-navy-card text-text-secondary border-navy-border hover:text-white'
                }`}
              >
                {pNum}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white disabled:opacity-40 disabled:hover:text-text-secondary transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </HudCornerFrame>
    </div>
  );
}
