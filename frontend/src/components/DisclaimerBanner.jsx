import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, X } from 'lucide-react';

export default function DisclaimerBanner({ isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="bg-navy-elevated/95 border-b border-risk-warning/40 px-4 py-2.5 backdrop-blur-md shadow-panel transition-all">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 p-1 rounded bg-risk-warning/15 border border-risk-warning/40 text-risk-warning">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-risk-warning font-mono">
                  Operational Guidelines & Evidentiary Standard
                </span>
                <span className="text-[10px] text-text-secondary">
                  [SNA & ACO Investigative Triage Only]
                </span>
              </div>
              <p className="text-xs text-text-primary/90 mt-0.5 leading-relaxed">
                This platform is an <strong>investigation-support tool</strong> designed to highlight 
                <em> anomalous vessel behaviour</em> (e.g., AIS gaps, STS rendezvous, flag-of-convenience switching). 
                Anomalies and high centrality scores <strong>do NOT prove or establish illicit activity</strong> or confirm shadow fleet membership.
              </p>

              {!collapsed && (
                <div className="mt-2.5 pt-2 border-t border-navy-border/60 text-[11px] text-text-secondary space-y-1.5 font-mono">
                  <div className="flex items-start space-x-2">
                    <span className="text-accent-cyan font-bold">•</span>
                    <span><strong>Standard of Review:</strong> All detections must be cross-checked with commercial bills of lading, satellite imagery (SAR/Optical), and port state inspection records.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-accent-cyan font-bold">•</span>
                    <span><strong>Approved Terminology:</strong> Use &quot;anomalous behaviour consistent with unmonitored STS transfer&quot; or &quot;requires investigative review&quot;. Never classify as &quot;guilty&quot; or &quot;confirmed illicit&quot;.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-accent-cyan font-bold">•</span>
                    <span><strong>Ant Colony Optimization (ACO):</strong> ACO is a heuristic pathfinder identifying plausible multi-hop transfer chains; it is not definitive tracking.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-[11px] font-mono text-text-secondary hover:text-accent-cyan flex items-center space-x-1 px-2 py-1 rounded bg-navy-card border border-navy-border"
            >
              <span>{collapsed ? 'View Standards' : 'Collapse'}</span>
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-text-secondary hover:text-white hover:bg-navy-card"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
