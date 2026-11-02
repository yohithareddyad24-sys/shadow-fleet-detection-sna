import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Radar, 
  Clock, 
  Search, 
  Info, 
  Ship, 
  ShieldAlert, 
  Bell,
  RefreshCw,
  User,
  Zap,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';
import BeaconDot from '../effects/BeaconDot';
import DemoBadge from '../common/DemoBadge';
import ReducedEffectsToggle from '../effects/ReducedEffectsToggle';

export default function Navbar({ 
  stats, 
  backendOnline, 
  isDemoMode,
  allVessels = [], 
  onOpenDisclaimer,
  onSelectVessel,
  onRefreshData
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // UTC clock & refresh state
  const [timeUtc, setTimeUtc] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Dynamic Page Title
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/overview':
        return 'Intelligence Overview';
      case '/map':
        return 'Interactive Maritime Map';
      case '/vessels':
        return 'Vessel Explorer';
      case '/risk-intelligence':
        return 'Risk Intelligence';
      case '/network':
        return 'Network Analysis & ACO Pathfinding';
      case '/alerts':
        return 'Alerts & Investigation Cases';
      case '/methodology':
        return 'Research Methodology & Standards';
      default:
        if (pathname.startsWith('/vessels/')) return 'Vessel Intelligence Dossier';
        return 'Maritime Intelligence SOC';
    }
  };

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Global Keyboard Shortcut: '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if already inside an input/textarea (unless it's Ctrl+K)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === 'Escape') {
        setSearchFocused(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Results
  const searchResults = debouncedSearch.trim().length > 0 
    ? allVessels.filter(v => 
        v.vessel_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        v.mmsi.includes(debouncedSearch) ||
        (v.imo && String(v.imo).includes(debouncedSearch)) ||
        v.flag.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelectVesselItem = (vessel) => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSearchFocused(false);
    if (onSelectVessel) {
      onSelectVessel(vessel);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const recentAlertsPreview = [
    { id: '1', title: 'Laconic Gulf STS Rendezvous', desc: 'MOCK_NEPTUNE_FEEDER with draught increase', time: '18m ago', severity: 'CRITICAL' },
    { id: '2', title: 'Skagerrak AIS Transmission Gap', desc: 'MOCK_BALTIC_RUNNER (15 consecutive gaps)', time: '1h ago', severity: 'ELEVATED' },
    { id: '3', title: 'Betweenness Hub Alert', desc: 'MOCK_HORIZON_DEST acting as bridge node', time: '3h ago', severity: 'MODERATE' },
    { id: '4', title: 'Flag-of-Convenience Shift', desc: 'MOCK_OCEAN_SHADOW altered registry to Gabon', time: '5h ago', severity: 'MODERATE' },
  ];

  return (
    <header className="bg-navy-sidebar border-b border-navy-border px-4 py-2 flex items-center justify-between select-none z-40 shrink-0 font-mono">
      
      {/* 1. Page Title & Breadcrumb Indicator */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-sm text-text-primary tracking-wide text-white">
              {getPageTitle(location.pathname)}
            </h1>
            <span className="text-[10px] text-accent-cyan/80 font-bold hidden lg:inline">
              // SOC SURVEILLANCE
            </span>
            {isDemoMode && <DemoBadge />}
          </div>
          <div className="text-[10px] text-text-secondary hidden sm:flex items-center space-x-2">
            <span>UNCLASSIFIED MARITIME INTELLIGENCE</span>
            <span className="text-navy-border">•</span>
            <span className="text-risk-warning/90">INVESTIGATION SUPPORT ONLY</span>
          </div>
        </div>
      </div>

      {/* 2. Global Vessel Search (Debounced, MMSI/IMO/Name, Shortcut '/' & Ctrl+K) */}
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search vessels by name, MMSI, IMO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="w-full pl-8 pr-16 py-1.5 bg-navy-card border border-navy-border rounded text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 transition-all"
            aria-label="Global vessel search"
          />

          {/* Shortcut indicator / Clear Button */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {searchTerm ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                className="text-[10px] text-text-secondary hover:text-white px-1"
              >
                ✕
              </button>
            ) : (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-navy-elevated border border-navy-border text-text-secondary/80 pointer-events-none">
                Ctrl+K
              </span>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && debouncedSearch.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-navy-elevated border border-navy-border rounded-md shadow-panel overflow-hidden z-50 animate-fadeIn">
            <div className="px-3 py-1.5 bg-navy-card/90 border-b border-navy-border/60 text-[10px] text-text-secondary flex justify-between">
              <span>Matching vessels ({searchResults.length})</span>
              <span>Press ESC to dismiss</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">
                No vessels found matching "{debouncedSearch}"
              </div>
            ) : (
              searchResults.map(v => (
                <div
                  key={v.mmsi}
                  onMouseDown={() => handleSelectVesselItem(v)}
                  className="px-3 py-2 border-b border-navy-border/50 last:border-0 hover:bg-navy-card cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-text-primary flex items-center space-x-2">
                      <span>{v.vessel_name}</span>
                      <span className="font-mono text-[10px] text-accent-cyan">[{v.mmsi}]</span>
                      {v.imo && <span className="font-mono text-[10px] text-text-secondary">IMO: {v.imo}</span>}
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
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Status Telemetry, Last Update, Notifications & Profile */}
      <div className="flex items-center space-x-3 text-xs">
        
        {/* Data-Source Status Indicator */}
        <div className="px-2 py-1 rounded bg-navy-card border border-navy-border flex items-center space-x-1.5">
          <BeaconDot active={backendOnline} statusText={backendOnline ? "API LIVE" : "DEMO ADAPTER"} />
        </div>

        {/* Last-Update Timestamp & Manual Refresh */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded bg-navy-card border border-navy-border text-text-secondary">
          <Clock className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="tabular-nums text-[11px] text-text-primary">
            {timeUtc || '00:00:00 UTC'}
          </span>
          <button
            onClick={handleManualRefresh}
            className="ml-1 p-0.5 hover:text-accent-cyan transition-colors"
            title="Reload data"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-accent-cyan' : ''}`} />
          </button>
        </div>

        {/* Notifications Icon with Unresolved Alerts Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white transition-colors relative"
            title="Unresolved Anomaly Alerts"
            aria-label="Alerts notification"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-risk-alert text-[9px] font-bold text-white flex items-center justify-center">
              4
            </span>
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-navy-elevated border border-navy-border rounded-lg shadow-panel p-2 z-50 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-navy-border/70 font-bold text-white">
                <span className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-risk-alert" />
                  <span>UNRESOLVED ALERTS (4)</span>
                </span>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/alerts');
                  }}
                  className="text-[10px] text-accent-cyan hover:underline flex items-center space-x-0.5"
                >
                  <span>View All</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="divide-y divide-navy-border/50 max-h-64 overflow-y-auto">
                {recentAlertsPreview.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/alerts');
                    }}
                    className="py-2 px-1 hover:bg-navy-card/60 cursor-pointer rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{alert.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        alert.severity === 'CRITICAL' ? 'bg-risk-alert/20 text-risk-alert border-risk-alert/30' :
                        alert.severity === 'ELEVATED' ? 'bg-risk-warning/20 text-risk-warning border-risk-warning/30' :
                        'bg-accent-blue/20 text-accent-cyan border-accent-blue/30'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{alert.desc}</div>
                    <div className="text-[9px] text-text-secondary/60 mt-1">{alert.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Placeholder with "Reduce Effects" Toggle Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 px-2.5 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border transition-colors text-text-primary"
            title="Analyst Profile & System Preferences"
          >
            <div className="w-5 h-5 rounded-full bg-accent-blue/30 border border-accent-cyan/60 flex items-center justify-center text-[10px] font-bold text-accent-cyan">
              03
            </div>
            <span className="hidden xl:inline text-xs font-bold text-white">Desk 03</span>
            <ChevronDown className="w-3 h-3 text-text-secondary" />
          </button>

          {/* Profile & Settings Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-navy-elevated border border-navy-border rounded-lg shadow-panel p-3 z-50 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-navy-border">
                <div className="w-8 h-8 rounded-full bg-accent-blue/30 border border-accent-cyan/60 flex items-center justify-center font-bold text-accent-cyan">
                  03
                </div>
                <div>
                  <div className="font-bold text-white">Operational Desk 03</div>
                  <div className="text-[10px] text-text-secondary">Maritime Analyst Lead</div>
                </div>
              </div>

              {/* Preferences: Reduce Effects Toggle */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                  Display Preferences
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-[11px]">Visual Effects:</span>
                  <ReducedEffectsToggle />
                </div>
              </div>

              {/* Ethics & Guidelines Modal Trigger */}
              <div className="pt-2 border-t border-navy-border space-y-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onOpenDisclaimer) onOpenDisclaimer();
                  }}
                  className="w-full text-left py-1.5 px-2 rounded hover:bg-navy-card text-text-secondary hover:text-accent-cyan flex items-center space-x-2 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="text-[11px]">Ethics & Evidentiary Standards</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/methodology');
                  }}
                  className="w-full text-left py-1.5 px-2 rounded hover:bg-navy-card text-text-secondary hover:text-accent-cyan flex items-center space-x-2 transition-colors"
                >
                  <Radar className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="text-[11px]">SNA Methodology Documentation</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
