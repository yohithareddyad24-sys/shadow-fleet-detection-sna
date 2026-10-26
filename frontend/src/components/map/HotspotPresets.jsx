import React from 'react';
import { Compass } from 'lucide-react';

export default function HotspotPresets({ onSelectHotspot }) {
  const presets = [
    { name: "Laconic Gulf (GR)", lat: 36.45, lng: 22.88, zoom: 8 },
    { name: "Malta Hurd Bank", lat: 35.92, lng: 14.56, zoom: 8 },
    { name: "Gibraltar Strait", lat: 36.10, lng: -5.32, zoom: 8 },
    { name: "Skagerrak / North Sea", lat: 57.72, lng: 11.96, zoom: 7 },
    { name: "Singapore Strait", lat: 1.30, lng: 103.90, zoom: 8 },
    { name: "Global Surveillance", lat: 30.0, lng: 20.0, zoom: 4 },
  ];

  return (
    <div className="bg-navy-sidebar/90 border border-navy-border/80 rounded-lg p-2.5 backdrop-blur-md shadow-panel space-y-1.5 text-[11px] font-mono select-none">
      <div className="text-text-secondary font-bold uppercase tracking-wider mb-1 flex items-center space-x-1.5">
        <Compass className="w-3.5 h-3.5 text-accent-cyan" />
        <span>Tactical Hotspots</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map(p => (
          <button
            key={p.name}
            onClick={() => onSelectHotspot(p.lat, p.lng, p.zoom)}
            className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
