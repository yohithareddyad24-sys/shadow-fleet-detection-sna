import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe2, 
  Table, 
  ShieldAlert, 
  Share2, 
  AlertTriangle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Radar,
  Radio
} from 'lucide-react';

export default function Sidebar({ alertCount = 4, isDemo = false }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('shadow_fleet_sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('shadow_fleet_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, badge: null, tooltip: 'Intelligence Overview SOC' },
    { to: '/map', label: 'Maritime Map', icon: Globe2, badge: 'TACTICAL', tooltip: 'Interactive Maritime Map' },
    { to: '/vessels', label: 'Vessel Explorer', icon: Table, badge: null, tooltip: 'Vessel Registry & Triage' },
    { to: '/risk-intelligence', label: 'Risk Intelligence', icon: ShieldAlert, badge: null, tooltip: 'Anomaly Analytics & Indices' },
    { to: '/network', label: 'Network Analysis', icon: Share2, badge: 'SNA+ACO', tooltip: 'SNA Graph & ACO Pathfinder' },
    { to: '/alerts', label: 'Alerts & Events', icon: AlertTriangle, count: alertCount, tooltip: 'Surveillance Alerts & Case Dossiers' },
    { to: '/methodology', label: 'Research Methodology', icon: BookOpen, badge: null, tooltip: 'Formulas & Evidentiary Standards' },
  ];

  return (
    <aside 
      className={`bg-navy-sidebar border-r border-navy-border flex flex-col justify-between select-none shrink-0 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Main Navigation"
    >
      {/* Top Header / Brand Section */}
      <div className="flex flex-col">
        {/* Brand Banner */}
        <div className="p-3 border-b border-navy-border/70 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2.5 group focus:outline-none overflow-hidden"
            title="SHADOW FLEET AI — Operations Center"
          >
            {/* Animated Radar-style Logo Mark */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-navy-card border border-navy-border shadow-panel shrink-0">
              <Radar className="w-4 h-4 text-accent-cyan group-hover:rotate-45 transition-transform" />
              <div className="absolute inset-0 rounded-lg border border-accent-cyan/40 animate-ping-radar pointer-events-none" />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold tracking-wider text-xs text-white text-glow-cyan">
                    SHADOW FLEET AI
                  </span>
                </div>
                <div className="text-[9px] text-text-secondary tracking-tight font-mono">
                  MARITIME INTELLIGENCE
                </div>
              </div>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-text-secondary hover:text-accent-cyan hover:bg-navy-card border border-transparent hover:border-navy-border transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger */}
        {isCollapsed && (
          <div className="p-2 flex justify-center border-b border-navy-border/40">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded text-text-secondary hover:text-accent-cyan hover:bg-navy-card border border-navy-border transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-text-secondary tracking-widest">
              Surveillance Modules
            </div>
          )}

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={isCollapsed ? item.tooltip : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-md text-xs font-mono transition-all group focus:outline-none focus:ring-1 focus:ring-accent-cyan relative ${
                    isActive
                      ? 'bg-navy-elevated text-accent-cyan font-bold border border-accent-cyan/40 shadow-sm'
                      : 'text-text-secondary hover:text-white hover:bg-navy-card/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-accent-cyan" />
                  {!isCollapsed && (
                    <span className="truncate">
                      <span className="text-[10px] text-accent-cyan/60 mr-1.5 font-bold">{idx + 1}</span>
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shrink-0">
                    {item.badge}
                  </span>
                )}

                {!isCollapsed && item.count !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-risk-warning/20 text-risk-warning border border-risk-warning/30 font-bold shrink-0">
                    {item.count}
                  </span>
                )}

                {/* Collapsed Badge Dot indicator */}
                {isCollapsed && item.count !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-risk-warning animate-ping" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Operational Grid Status Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-navy-border bg-navy-card/40 font-mono text-[10px] text-text-secondary space-y-1">
          <div className="flex items-center justify-between text-text-primary">
            <span>SURVEILLANCE SECTOR:</span>
            <span className="text-accent-cyan font-bold">MED / GLOBAL</span>
          </div>
          <div>ALGORITHM: <span className="text-white">NetworkX + ACO</span></div>
          <div className="text-[9px] text-risk-warning">INVESTIGATION SUPPORT ONLY</div>
        </div>
      ) : (
        <div className="p-2 border-t border-navy-border/60 flex justify-center text-[10px] text-accent-cyan font-mono" title="Mediterranean Surveillance Sector">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
      )}
    </aside>
  );
}
