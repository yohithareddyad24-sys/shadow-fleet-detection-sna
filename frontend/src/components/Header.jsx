import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  ShieldAlert, 
  Clock, 
  Radio, 
  Search, 
  AlertTriangle, 
  Ship, 
  Share2, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import StatusDot from './effects/StatusDot';
import CountingNumber from './effects/CountingNumber';
import ReducedEffectsToggle from './effects/ReducedEffectsToggle';
import TopProgressBar from './effects/TopProgressBar';

export default function Header({ 
  stats, 
  backendOnline, 
  searchTerm, 
  setSearchTerm, 
  onSelectVessel, 
  allVessels,
  onOpenDisclaimer,
  isLoading = false 
}) {
  const [timeUtc, setTimeUtc] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const searchResults = searchTerm.trim().length > 0 
    ? allVessels.filter(v => 
        v.vessel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.mmsi.includes(searchTerm) ||
        (v.imo && v.imo.includes(searchTerm)) ||
        v.flag.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="bg-navy-sidebar/95 border-b border-navy-border px-4 py-2 flex items-center justify-between select-none relative z-50 backdrop-blur-md">
      {/* Animated Top Progress Bar on route changes and data refreshes */}
      <TopProgressBar isLoading={isLoading} />

      {/* Left: Brand & Classification */}
      <div className="flex items-center space-x-3.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-navy-card border border-navy-border shadow-panel">
          <Radar className="w-5 h-5 text-accent-cyan" />
          <div className="absolute inset-0 rounded-lg border border-accent-cyan/30 animate-ping-radar pointer-events-none" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold tracking-wider text-base text-text-primary text-glow-cyan">
              SHADOW FLEET AI
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent-blue/15 text-accent-cyan border border-accent-blue/30 font-semibold tracking-wider">
              OPERATIONAL v2.4
            </span>
          </div>
          <div className="text-[11px] text-text-secondary tracking-tight flex items-center space-x-2">
            <span>Maritime Intelligence & Behavioral SNA Console</span>
            <span className="text-navy-border">•</span>
            <span className="text-[10px] text-risk-warning/90 font-mono tracking-wider">
              UNCLASSIFIED // INVESTIGATION SUPPORT
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6 relative">
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vessel by MMSI, IMO, name, or flag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full pl-9 pr-3 py-1.5 bg-navy-card border border-navy-border rounded-md text-xs font-mono text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-navy-elevated border border-navy-border rounded-md shadow-panel overflow-hidden z-50">
            {searchResults.map(v => (
              <div
                key={v.mmsi}
                onMouseDown={() => {
                  onSelectVessel(v);
                  setSearchTerm('');
                }}
                className="px-3 py-2 border-b border-navy-border/50 last:border-0 hover:bg-navy-card/80 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary flex items-center space-x-2">
                    <span>{v.vessel_name}</span>
                    <span className="font-mono text-[10px] text-text-secondary">[{v.mmsi}]</span>
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {v.flag} • {v.vessel_type} • {v.port}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  v.risk_tier === 'CRITICAL_MONITORING' ? 'bg-risk-alert/20 text-risk-alert' :
                  v.risk_tier === 'ELEVATED_ATTENTION' ? 'bg-risk-warning/20 text-risk-warning' :
                  v.risk_tier === 'MODERATE_INTERACTION' ? 'bg-accent-blue/20 text-accent-cyan' :
                  'bg-risk-success/20 text-risk-success'
                }`}>
                  {(v.composite_risk_score * 100).toFixed(0)}% RISK
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Operational Telemetry & Counters */}
      <div className="flex items-center space-x-3">
        {/* Metric Telemetry Pills with Counting numbers */}
        <div className="hidden lg:flex items-center space-x-2">
          <div className="px-2.5 py-1 bg-navy-card border border-navy-border rounded flex items-center space-x-2">
            <Ship className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-[10px] uppercase text-text-secondary tracking-wider">Fleet:</span>
            <CountingNumber 
              value={stats?.total_vessels || 12} 
              className="text-xs font-mono font-semibold text-text-primary" 
            />
          </div>

          <div className="px-2.5 py-1 bg-navy-card border border-navy-border rounded flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-risk-warning animate-pulse" />
            <span className="text-[10px] uppercase text-text-secondary tracking-wider">Elevated:</span>
            <CountingNumber 
              value={stats?.elevated_count || 3} 
              className="text-xs font-mono font-semibold text-risk-warning" 
            />
          </div>

          <div className="px-2.5 py-1 bg-navy-card border border-navy-border rounded flex items-center space-x-2">
            <Share2 className="w-3.5 h-3.5 text-accent-blue" />
            <span className="text-[10px] uppercase text-text-secondary tracking-wider">STS Ops:</span>
            <CountingNumber 
              value={stats?.total_interactions || 12} 
              className="text-xs font-mono font-semibold text-text-primary" 
            />
          </div>
        </div>

        {/* Tactical Status dot with soft breathing pulse */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-navy-card border border-navy-border">
          <StatusDot 
            status={backendOnline ? 'live' : 'stale'} 
            label={backendOnline ? 'API LIVE' : 'CLIENT CACHE'} 
          />
        </div>

        {/* Global Reduced Effects Switch */}
        <ReducedEffectsToggle />

        {/* Live UTC Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-navy-card border border-navy-border">
          <Clock className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-mono text-xs font-medium text-text-primary tabular-nums">
            {timeUtc || '00:00:00 UTC'}
          </span>
        </div>

        {/* Legal Disclaimer trigger */}
        <button
          onClick={onOpenDisclaimer}
          title="Review Maritime Intelligence Ethics & Disclaimer"
          className="p-1.5 rounded-md bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
