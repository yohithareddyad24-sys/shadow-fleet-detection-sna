import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe2, 
  Table, 
  ShieldCheck, 
  Share2, 
  AlertTriangle, 
  BookOpen, 
  GitBranch,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ alertCount = 3 }) {
  const navItems = [
    { to: '/', label: 'Operations SOC', icon: LayoutDashboard },
    { to: '/map', label: 'Tactical Map', icon: Globe2, badge: 'LIVE' },
    { to: '/vessels', label: 'Fleet Explorer', icon: Table },
    { to: '/risk-intelligence', label: 'Risk Intelligence', icon: ShieldCheck },
    { to: '/network', label: 'SNA & ACO Path', icon: Share2, badge: 'ACO' },
    { to: '/alerts', label: 'Alerts & Cases', icon: AlertTriangle, count: alertCount },
    { to: '/methodology', label: 'Methodology & Standards', icon: BookOpen },
  ];

  return (
    <aside className="w-56 bg-navy-sidebar border-r border-navy-border flex flex-col justify-between select-none shrink-0" aria-label="Main Navigation">
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-text-secondary tracking-widest">
          Surveillance Modules
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono transition-all group focus:outline-none focus:ring-1 focus:ring-accent-cyan ${
                  isActive
                    ? 'bg-navy-elevated text-accent-cyan font-bold border border-accent-cyan/40 shadow-sm'
                    : 'text-text-secondary hover:text-white hover:bg-navy-card/60 border border-transparent'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-accent-cyan" />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-risk-warning/20 text-risk-warning border border-risk-warning/30 font-bold">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Operational Grid Status Footer */}
      <div className="p-3 border-t border-navy-border bg-navy-card/40 font-mono text-[10px] text-text-secondary space-y-1">
        <div className="flex items-center justify-between text-text-primary">
          <span>SURVEILLANCE SECTOR:</span>
          <span className="text-accent-cyan font-bold">MED / GLOBAL</span>
        </div>
        <div>ALGORITHM: <span className="text-white">NetworkX + ACO</span></div>
        <div className="text-[9px] text-risk-warning">INVESTIGATION SUPPORT ONLY</div>
      </div>
    </aside>
  );
}
