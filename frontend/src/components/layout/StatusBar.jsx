import React from 'react';
import { Crosshair, Shield, Activity, Database } from 'lucide-react';

export default function StatusBar({ totalVessels = 12, isDemo = false, backendOnline = true }) {
  return (
    <footer className="bg-navy-sidebar border-t border-navy-border px-4 py-1.5 flex items-center justify-between font-mono text-[11px] text-text-secondary select-none shrink-0" aria-label="System Status Bar">
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1.5 text-text-primary">
          <Activity className="w-3 h-3 text-accent-cyan" />
          <span>SYS STATUS:</span>
          <span className={`font-bold ${backendOnline ? 'text-risk-success' : 'text-risk-warning'}`}>
            {backendOnline ? 'OPERATIONAL // STREAMING' : 'OFFLINE // DEMO SIMULATION'}
          </span>
        </span>
        <span>•</span>
        <span>TARGETS ACQUIRED: <strong className="text-white">{totalVessels}</strong></span>
        {isDemo && (
          <>
            <span>•</span>
            <span className="text-risk-warning font-semibold flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span>DEMO ADAPTER ACTIVE</span>
            </span>
          </>
        )}
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <span>SECURITY LEVEL: <strong className="text-white">UNCLASSIFIED</strong></span>
        <span>STANDARD: <strong className="text-accent-cyan">EU/IMO TRIAGE</strong></span>
      </div>
    </footer>
  );
}
