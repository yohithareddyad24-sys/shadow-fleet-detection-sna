import React from 'react';
import { 
  Globe2, 
  Table, 
  Share2, 
  GitBranch, 
  BarChart3, 
  FolderLock,
  Compass
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, caseCount = 2 }) {
  const tabs = [
    { id: 'map', label: 'Tactical Map', icon: Globe2, badge: 'LIVE' },
    { id: 'table', label: 'Fleet Registry', icon: Table, count: 12 },
    { id: 'network', label: 'SNA Graph', icon: Share2, badge: 'NetworkX' },
    { id: 'aco', label: 'ACO Pathfinder', icon: GitBranch, badge: 'Heuristic' },
    { id: 'analytics', label: 'Intelligence SOC', icon: BarChart3 },
    { id: 'cases', label: 'Case Files', icon: FolderLock, count: caseCount },
  ];

  return (
    <nav className="bg-navy-sidebar/90 border-b border-navy-border px-4 py-1.5 flex items-center justify-between select-none relative backdrop-blur-sm z-40">
      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-navy-elevated text-accent-cyan border border-accent-cyan/40 shadow-sm nav-active-glow' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-navy-card/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-accent-cyan text-glow-cyan' : 'text-text-secondary'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>

              {tab.badge && (
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${
                  isActive 
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30' 
                    : 'bg-navy-card text-text-secondary border-navy-border'
                }`}>
                  {tab.badge}
                </span>
              )}

              {tab.count !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive 
                    ? 'bg-accent-cyan text-navy-bg font-bold shadow-sm' 
                    : 'bg-navy-border text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center space-x-2 text-[11px] text-text-secondary font-mono">
        <Compass className="w-3.5 h-3.5 text-accent-cyan" />
        <span>SURVEILLANCE GRID: MED & CHOKEPOINTS</span>
      </div>
    </nav>
  );
}
