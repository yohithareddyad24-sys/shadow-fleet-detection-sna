import React from 'react';
import { X, ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-navy-elevated border border-navy-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden font-mono text-xs text-text-primary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
      >
        <div className="bg-navy-sidebar border-b border-navy-border px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-risk-warning font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <h2 id="disclaimer-title">MARITIME INTELLIGENCE EVANGELISM & ETHICS STANDARD</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-white hover:bg-navy-card focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 leading-relaxed">
          <div className="p-3 rounded bg-risk-warning/10 border border-risk-warning/30 text-risk-warning">
            <strong>CRITICAL INVESTIGATIVE NOTICE:</strong>
            <p className="mt-1 text-text-primary/90 text-xs">
              This system is strictly an <strong>investigation-support triage tool</strong>. 
              The detection of an anomaly or elevated centrality metric must <strong>NEVER</strong> be construed as proof that a vessel is engaged in illegal acts or is definitively part of a shadow fleet.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-accent-cyan uppercase tracking-wider text-[11px]">Approved Standardized Terminology</h3>
            <ul className="space-y-1.5 text-text-secondary">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-risk-success shrink-0 mt-0.5" />
                <span><strong>Use:</strong> &quot;Anomalous behaviour consistent with unmonitored STS transfer&quot;</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-risk-success shrink-0 mt-0.5" />
                <span><strong>Use:</strong> &quot;Requires further operational review / analyst corroboration&quot;</span>
              </li>
              <li className="flex items-start space-x-2">
                <X className="w-3.5 h-3.5 text-risk-alert shrink-0 mt-0.5" />
                <span><strong>Never use:</strong> &quot;Guilty&quot;, &quot;Smuggler&quot;, &quot;Confirmed shadow fleet&quot;, &quot;Illicit operator&quot;</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-accent-cyan uppercase tracking-wider text-[11px]">Algorithmic Limitations (SNA & ACO)</h3>
            <p className="text-text-secondary">
              1. <strong>Social Network Analysis (SNA):</strong> Degree and betweenness centralities identify topological hub and bridge roles in synthetic interaction graphs. Legitimate bunkering tankers and port support tugs frequently exhibit high centrality without any sanctions evasion affiliation.
            </p>
            <p className="text-text-secondary">
              2. <strong>Ant Colony Optimization (ACO):</strong> ACO is a stochastic path search heuristic to prioritize multi-hop transfer hypotheses for human review; it does not replace empirical surveillance.
            </p>
            <p className="text-text-secondary">
              3. <strong>AIS Transmission Gaps:</strong> Gaps can occur legitimately due to atmospheric propagation loss, terrestrial receiver topography occlusion, equipment failure, or severe weather.
            </p>
          </div>
        </div>

        <div className="bg-navy-sidebar border-t border-navy-border px-5 py-3 flex items-center justify-between text-text-secondary text-[11px]">
          <span>UNCLASSIFIED // FOR INVESTIGATIVE DEMONSTRATION USE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-cyan border border-accent-blue/40 font-bold focus:outline-none"
          >
            Acknowledge Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}
