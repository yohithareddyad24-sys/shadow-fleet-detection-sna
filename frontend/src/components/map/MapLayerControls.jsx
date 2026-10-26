import React from 'react';
import { Layers } from 'lucide-react';

export default function MapLayerControls({ 
  showVessels, 
  setShowVessels, 
  showStsZones, 
  setShowStsZones, 
  showGapCorridors, 
  setShowGapCorridors,
  hasAcoRoute,
  showAcoPath,
  setShowAcoPath
}) {
  return (
    <div className="bg-navy-sidebar/90 border border-navy-border/80 rounded-lg p-2.5 backdrop-blur-md shadow-panel space-y-2 text-xs font-mono text-text-primary select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/60">
        <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>SURVEILLANCE LAYERS</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
            <span>Monitored Vessels</span>
          </span>
          <input
            type="checkbox"
            checked={showVessels}
            onChange={() => setShowVessels(!showVessels)}
            className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-risk-warning" />
            <span>STS Rendezvous Areas</span>
          </span>
          <input
            type="checkbox"
            checked={showStsZones}
            onChange={() => setShowStsZones(!showStsZones)}
            className="rounded bg-navy-card border-navy-border text-risk-warning focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-risk-alert" />
            <span>Dark AIS Gap Corridors</span>
          </span>
          <input
            type="checkbox"
            checked={showGapCorridors}
            onChange={() => setShowGapCorridors(!showGapCorridors)}
            className="rounded bg-navy-card border-navy-border text-risk-alert focus:ring-0"
          />
        </label>

        {hasAcoRoute && (
          <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
              <span>Projected ACO Pathway</span>
            </span>
            <input
              type="checkbox"
              checked={showAcoPath}
              onChange={() => setShowAcoPath(!showAcoPath)}
              className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
            />
          </label>
        )}
      </div>
    </div>
  );
}
