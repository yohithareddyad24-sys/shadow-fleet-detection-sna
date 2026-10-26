import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Radar, 
  Clock, 
  Search, 
  Info, 
  Ship, 
  ShieldAlert, 
  Share2,
  Database
} from 'lucide-react';
import BeaconDot from '../effects/BeaconDot';
import DemoBadge from '../common/DemoBadge';

export default function Navbar({ 
  stats, 
  backendOnline, 
  isDemoMode,
  allVessels = [], 
  onOpenDisclaimer 
}) {
  const [timeUtc, setTimeUtc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

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

  const handleSelectVessel = (mmsi) => {
    setSearchTerm('');
    setSearchFocused(false);
    navigate(`/vessels/${mmsi}`);
  };

  return (
    <header className="bg-navy-sidebar border-b border-navy-border px-4 py-2 flex items-center justify-between select-none z-50 shrink-0">
      {/* Brand & Classification */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-3 group focus:outline-none focus:ring-1 focus:ring-accent-cyan rounded p-1">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-navy-card border border-navy-border shadow-panel">
            <Radar className="w-4 h-4 text-accent-cyan group-hover:rotate-45 transition-transform" />
            <div className="absolute inset-0 rounded-lg border border-accent-cyan/30 animate-ping-radar pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold tracking-wider text-sm text-text-primary text-glow-cyan">
                SHADOW FLEET AI
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-accent-blue/15 text-accent-cyan border border-accent-blue/30 font-semibold tracking-wider">
                v2.5
              </span>
              {isDemoMode && <DemoBadge />}
            </div>
            <div className="text-[10px] text-text-secondary tracking-tight hidden sm:flex items-center space-x-2">
              <span>Maritime Intelligence Console</span>
              <span className="text-navy-border">•</span>
              <span className="text-risk-warning/90 font-mono tracking-wider">
                UNCLASSIFIED // INVESTIGATION SUPPORT
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Global Vessel Search */}
      <div className="flex-1 max-w-sm mx-4 relative hidden md:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search MMSI, IMO, vessel, or flag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
            className="w-full pl-8 pr-3 py-1.5 bg-navy-card border border-navy-border rounded text-xs font-mono text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 transition-all"
            aria-label="Search vessel"
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
                onMouseDown={() => handleSelectVessel(v.mmsi)}
                className="px-3 py-2 border-b border-navy-border/50 last:border-0 hover:bg-navy-card cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-text-primary flex items-center space-x-2">
                    <span>{v.vessel_name}</span>
                    <span className="font-mono text-[10px] text-text-secondary">[{v.mmsi}]</span>
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {v.flag} • {v.vessel_type}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  v.risk_tier === 'CRITICAL_MONITORING' ? 'bg-risk-alert/20 text-risk-alert' :
                  v.risk_tier === 'ELEVATED_ATTENTION' ? 'bg-risk-warning/20 text-risk-warning' :
                  v.risk_tier === 'MODERATE_INTERACTION' ? 'bg-accent-blue/20 text-accent-cyan' :
                  'bg-risk-success/20 text-risk-success'
                }`}>
                  {(v.composite_risk_score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Telemetry Counters & Backend Status */}
      <div className="flex items-center space-x-3 font-mono text-xs">
        <div className="hidden xl:flex items-center space-x-2">
          <div className="px-2 py-1 bg-navy-card border border-navy-border rounded flex items-center space-x-1.5">
            <Ship className="w-3 h-3 text-accent-cyan" />
            <span className="text-[10px] text-text-secondary uppercase">Monitored:</span>
            <span className="text-xs font-bold text-white">{stats?.total_vessels || 12}</span>
          </div>

          <div className="px-2 py-1 bg-navy-card border border-navy-border rounded flex items-center space-x-1.5">
            <ShieldAlert className="w-3 h-3 text-risk-warning" />
            <span className="text-[10px] text-text-secondary uppercase">Elevated:</span>
            <span className="text-xs font-bold text-risk-warning">{stats?.elevated_count || 3}</span>
          </div>
        </div>

        {/* Backend Online status pill */}
        <div className="px-2 py-1 rounded bg-navy-card border border-navy-border flex items-center space-x-1.5">
          <BeaconDot active={backendOnline} statusText={backendOnline ? "API LIVE" : "DEMO ADAPTER"} />
        </div>

        {/* UTC Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-navy-card border border-navy-border">
          <Clock className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-mono text-xs text-text-primary tabular-nums">
            {timeUtc || '00:00:00 UTC'}
          </span>
        </div>

        {/* Ethics Disclaimer trigger */}
        <button
          onClick={onOpenDisclaimer}
          title="Review Maritime Ethics Guidelines"
          className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan"
          aria-label="Ethics guidelines"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
