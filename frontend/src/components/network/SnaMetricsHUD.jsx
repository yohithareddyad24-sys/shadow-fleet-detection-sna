import React, { useState } from 'react';
import { Info, HelpCircle, Layers, Award, Activity } from 'lucide-react';

export default function SnaMetricsHUD({ 
  metrics, 
  centralityMetric, 
  setCentralityMetric,
  topCentralityNodes = [],
  onSelectNode,
  isDirected,
  setIsDirected
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const metricTooltips = {
    totalNodes: "Total unique vessels and maritime entities mapped in the interaction network.",
    totalEdges: "Total observed bilateral rendezvous encounters, shared management ties, and physical proximity events.",
    density: "Ratio of existing interaction ties to all mathematically possible pairs. Higher density indicates tight coordination.",
    components: "Disconnected subgraphs. Multiple components indicate isolated feeder lines or decoupled operational clusters.",
    avgDegree: "Average number of distinct bilateral relationships per vessel across the surveillance network.",
    degreeCentrality: "Direct interaction volume. Measures immediate operational connectivity and regional feeder hub presence.",
    betweennessCentrality: "Frequency with which a vessel falls on the shortest path between all other pairs. Identifies critical bridge intermediaries.",
    closenessCentrality: "Inverse sum of shortest distances to all reachable vessels. Identifies rapid-information or rapid-cargo propagation conduits.",
    inOutDegree: "Directed interaction asymmetry: In-degree (vessels approaching this node) vs Out-degree (this node approaching others)."
  };

  return (
    <div className="glass-panel rounded-lg p-3 shadow-panel font-mono text-xs space-y-2.5 min-w-[280px] max-w-sm select-none border border-navy-border/80">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
        <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-accent-cyan" />
          <span>SNA CORE METRICS</span>
        </span>
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-text-secondary">MODE:</span>
          <button
            onClick={() => setIsDirected(!isDirected)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              isDirected 
                ? 'bg-accent-blue/30 text-accent-cyan border-accent-blue/50' 
                : 'bg-navy-card text-text-secondary border-navy-border hover:text-white'
            }`}
            title="Toggle between directed encounter vector and undirected topology"
          >
            {isDirected ? 'DIRECTED' : 'UNDIRECTED'}
          </button>
        </div>
      </div>

      {/* Grid of Core Numerical Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Nodes */}
        <div className="p-2 rounded bg-navy-card/80 border border-navy-border relative group">
          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>NODES</span>
            <button 
              onMouseEnter={() => setActiveTooltip('totalNodes')} 
              onMouseLeave={() => setActiveTooltip(null)}
              className="text-text-secondary hover:text-accent-cyan"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-base font-bold text-white mt-0.5 font-mono">
            {metrics?.totalNodes ?? 12}
          </div>
        </div>

        {/* Edges */}
        <div className="p-2 rounded bg-navy-card/80 border border-navy-border relative group">
          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>RELATIONSHIPS</span>
            <button 
              onMouseEnter={() => setActiveTooltip('totalEdges')} 
              onMouseLeave={() => setActiveTooltip(null)}
              className="text-text-secondary hover:text-accent-cyan"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-base font-bold text-white mt-0.5 font-mono">
            {metrics?.totalEdges ?? 11}
          </div>
        </div>

        {/* Density */}
        <div className="p-2 rounded bg-navy-card/80 border border-navy-border relative group">
          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>DENSITY</span>
            <button 
              onMouseEnter={() => setActiveTooltip('density')} 
              onMouseLeave={() => setActiveTooltip(null)}
              className="text-text-secondary hover:text-accent-cyan"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-base font-bold text-accent-cyan mt-0.5 font-mono">
            {metrics?.density?.toFixed(4) ?? '0.1818'}
          </div>
        </div>

        {/* Components */}
        <div className="p-2 rounded bg-navy-card/80 border border-navy-border relative group">
          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>COMPONENTS</span>
            <button 
              onMouseEnter={() => setActiveTooltip('components')} 
              onMouseLeave={() => setActiveTooltip(null)}
              className="text-text-secondary hover:text-accent-cyan"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-base font-bold text-risk-warning mt-0.5 font-mono">
            {metrics?.numConnectedComponents ?? 2}
          </div>
        </div>
      </div>

      {/* Degrees & In/Out Details */}
      <div className="p-2 rounded bg-navy-card/80 border border-navy-border text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary flex items-center space-x-1">
            <span>Average Degree:</span>
            <button 
              onMouseEnter={() => setActiveTooltip('avgDegree')} 
              onMouseLeave={() => setActiveTooltip(null)}
              className="text-text-secondary hover:text-accent-cyan"
            >
              <Info className="w-2.5 h-2.5" />
            </button>
          </span>
          <span className="font-bold text-white font-mono">{metrics?.averageDegree?.toFixed(2) ?? '2.00'}</span>
        </div>

        {isDirected && (
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-navy-border/60">
            <span className="text-text-secondary">Avg In: {metrics?.averageInDegree?.toFixed(2) ?? '1.00'}</span>
            <span className="text-text-secondary">Avg Out: {metrics?.averageOutDegree?.toFixed(2) ?? '1.00'}</span>
          </div>
        )}
      </div>

      {/* Centrality Metric Selector (Drives Node Sizing & Top 5 Highlight) */}
      <div className="space-y-1.5 pt-1 border-t border-navy-border/70">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-secondary font-bold">NODE SIZE DRIVER:</span>
          <select
            value={centralityMetric}
            onChange={(e) => setCentralityMetric(e.target.value)}
            className="bg-navy-card border border-navy-border rounded px-2 py-0.5 text-xs text-accent-cyan font-bold focus:outline-none focus:border-accent-cyan"
          >
            <option value="betweenness">Betweenness (Bridge Conduits)</option>
            <option value="degree">Degree (Encounter Volume)</option>
            <option value="closeness">Closeness (Propagation Speed)</option>
          </select>
        </div>

        {/* Top 5 Highlighting */}
        <div className="pt-1">
          <div className="text-[10px] text-text-secondary mb-1 flex items-center justify-between">
            <span className="font-bold flex items-center space-x-1">
              <Award className="w-3 h-3 text-accent-cyan" />
              <span>TOP 5 HIGHEST CENTRALITY:</span>
            </span>
            <span className="text-accent-cyan text-[9px] uppercase">{centralityMetric}</span>
          </div>

          <div className="space-y-1">
            {topCentralityNodes.slice(0, 5).map((node, rank) => (
              <div
                key={node.id}
                onClick={() => onSelectNode && onSelectNode(node)}
                className="flex items-center justify-between px-2 py-1 rounded bg-navy-card/60 hover:bg-navy-elevated cursor-pointer transition-colors text-[10px] group border border-transparent hover:border-accent-cyan/40"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-accent-cyan font-bold font-mono">#{rank + 1}</span>
                  <span className="text-white group-hover:text-accent-cyan truncate">{node.fullName || node.label}</span>
                </div>
                <span className="text-accent-cyan font-mono font-bold shrink-0">
                  {centralityMetric === 'betweenness' 
                    ? node.betweenness?.toFixed(4)
                    : centralityMetric === 'closeness'
                    ? node.closeness?.toFixed(4)
                    : node.degree?.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Info Tooltip Banner */}
      {activeTooltip && (
        <div className="p-2 rounded bg-navy-elevated border border-accent-cyan/60 text-[10px] text-text-primary leading-tight shadow-lg animate-fadeIn">
          {metricTooltips[activeTooltip]}
        </div>
      )}

    </div>
  );
}
