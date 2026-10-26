import React from 'react';
import { Share2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';

export default function NetworkControlPanel({ 
  layoutName, 
  setLayoutName, 
  componentFilter, 
  setComponentFilter, 
  componentCount = 2,
  onZoomIn,
  onZoomOut,
  onResetFit,
  isDemo = false 
}) {
  return (
    <div className="bg-navy-sidebar/95 border border-navy-border rounded-lg p-3 shadow-panel backdrop-blur-md space-y-2.5 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border">
        <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
          <Share2 className="w-3.5 h-3.5" />
          <span>SNA TOPOLOGY CONTROLS</span>
        </span>
        {isDemo && <DemoBadge />}
      </div>

      {/* Layout Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-text-secondary text-[11px]">LAYOUT:</span>
        <select
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          className="bg-navy-card border border-navy-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan"
        >
          <option value="cose">Force-Directed (CoSE)</option>
          <option value="concentric">Concentric (Risk Rings)</option>
          <option value="circle">Circular Topology</option>
          <option value="breadthfirst">Hierarchical Tree</option>
        </select>
      </div>

      {/* Subgraph Filter */}
      <div className="flex items-center space-x-2">
        <span className="text-text-secondary text-[11px]">SUBGRAPH:</span>
        <select
          value={componentFilter}
          onChange={(e) => setComponentFilter(e.target.value)}
          className="bg-navy-card border border-navy-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan"
        >
          <option value="ALL">All Components ({componentCount})</option>
          <option value="1">Component 1 (Active Cluster - 10 Vessels)</option>
          <option value="2">Component 2 (Isolated Subgraph - 2 Vessels)</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1.5 pt-1">
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetFit}
          className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan flex items-center space-x-1"
          title="Reset View Bounds"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Fit</span>
        </button>
      </div>
    </div>
  );
}
