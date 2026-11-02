import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Share2, 
  GitBranch, 
  Radio, 
  AlertTriangle, 
  Scale, 
  FileText, 
  CheckCircle2, 
  Info,
  Layers,
  Cpu
} from 'lucide-react';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function MethodologyView() {
  return (
    <div className="w-full h-full p-4 overflow-y-auto font-mono text-text-primary select-none space-y-4">
      
      {/* Top Header Banner */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex items-center justify-between glass-panel" glow>
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>RESEARCH METHODOLOGY // MATHEMATICAL FRAMEWORK & EVIDENTIARY STANDARDS</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Algorithmic definitions, heuristic weights, network graph theory, and legal standards for maritime anomaly triage.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-risk-warning bg-risk-warning/10 border border-risk-warning/30 px-3 py-1.5 rounded">
          <Scale className="w-4 h-4" />
          <span>INVESTIGATION SUPPORT // NON-PROBABILISTIC</span>
        </div>
      </HudCornerFrame>

      {/* Grid: Mathematical Scoring Formula & Heuristics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card 1: 5-Factor Composite Risk Score Formula */}
        <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-border text-xs font-bold text-white">
            <Cpu className="w-4 h-4 text-accent-cyan" />
            <span>1. COMPOSITE ANOMALY SCORE FORMULATION</span>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed space-y-2">
            <p>
              Vessel anomaly scores are generated through a deterministic multi-criteria heuristic model. The score is strictly bounded in <code className="text-accent-cyan">[0.0, 1.0]</code> and represents behavioral divergence, <strong>not a probability of guilt</strong>.
            </p>

            <div className="p-3 rounded bg-navy-card border border-navy-border font-mono text-[11px] text-accent-cyan space-y-1">
              <div className="text-white font-bold">R_composite(v) = ∑ (w_i × f_i(v))</div>
              <div className="text-text-secondary text-[10px] pl-2 border-l border-accent-cyan/40 mt-2 space-y-0.5">
                <div>• w_deg (0.20) × Degree Centrality [Interaction Volume]</div>
                <div>• w_bet (0.30) × Betweenness Centrality [Bridge Intermediary Role]</div>
                <div>• w_flag (0.25) × Flag-of-Convenience Risk Weight</div>
                <div>• w_gap (0.15) × Normalized Dark AIS Transmission Gaps</div>
                <div>• w_spf (0.10) × Kinematic Discrepancy & Spoofing Incidents</div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-text-secondary">
              Weights reflect empirical findings from Mediterranean & Baltic illicit transfer networks where intermediate bridge vessels facilitate multi-tier ship-to-ship (STS) cargo handoffs.
            </div>
          </div>
        </HudCornerFrame>

        {/* Card 2: Social Network Analysis (SNA) Centralities */}
        <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-border text-xs font-bold text-white">
            <Share2 className="w-4 h-4 text-accent-cyan" />
            <span>2. SOCIAL NETWORK ANALYSIS (SNA) GRAPH METRICS</span>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed space-y-2.5">
            <div>
              <strong className="text-white">Degree Centrality (C_D):</strong>
              <p className="text-[11px] mt-0.5">
                Measures the direct volume of verified bilateral encounters (proximity &lt; 0.5 nm with speed &lt; 3.0 kn for &gt; 2.0 hours). High degree indicates a central coordination hub or regional feeder.
              </p>
            </div>

            <div>
              <strong className="text-white">Betweenness Centrality (C_B):</strong>
              <p className="text-[11px] mt-0.5">
                Quantifies how frequently a vessel lies on the shortest path between all other vessel pairs: <code className="text-accent-cyan">C_B(v) = ∑ (σ_st(v) / σ_st)</code>. High betweenness highlights critical multi-hop transfer conduits that obscure origin cargos.
              </p>
            </div>

            <div className="p-2.5 rounded bg-navy-card/80 border border-navy-border text-[10px] text-risk-warning flex items-center space-x-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Bridge vessels frequently maintain nominal baseline inspection records to shield high-risk counterparties.</span>
            </div>
          </div>
        </HudCornerFrame>

        {/* Card 3: Ant Colony Optimization (ACO) Pathfinder */}
        <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-border text-xs font-bold text-white">
            <GitBranch className="w-4 h-4 text-accent-cyan" />
            <span>3. ANT COLONY OPTIMIZATION (ACO) TRANSFER CHAINS</span>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed space-y-2">
            <p>
              Illicit supply chains use complex daisy-chain transfers to obscure the ultimate origin of maritime cargoes. Ant Colony Optimization simulates artificial pheromone trails to uncover most-likely multi-hop pathways between flagged origin ports and destination terminals.
            </p>

            <div className="p-3 rounded bg-navy-card border border-navy-border text-[11px] space-y-1">
              <div className="text-white font-bold">Transition Probability:</div>
              <div className="text-accent-cyan">P_ij^k = [τ_ij]^α × [η_ij]^β / ∑ ([τ_il]^α × [η_il]^β)</div>
              <div className="text-[10px] text-text-secondary mt-1">
                Where τ_ij is pheromone density (cumulative transfer risk) and η_ij is heuristic inverse cost based on duration, draught variance, and encounter frequency.
              </div>
            </div>
          </div>
        </HudCornerFrame>

        {/* Card 4: Evidentiary Standards & Legal Protections */}
        <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-border text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-accent-cyan" />
            <span>4. EVIDENTIARY STANDARDS & ETHICAL SAFEGUARDS</span>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed space-y-2">
            <p>
              In accordance with international maritime law (UNCLOS, SOLAS Regulation V/19) and evidentiary due diligence principles:
            </p>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-risk-success shrink-0 mt-0.5" />
                <span><strong>Presumption of Innocence:</strong> High anomaly scores signify investigative priority, never confirmed sanction violations.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-risk-success shrink-0 mt-0.5" />
                <span><strong>Alternative Hypotheses:</strong> Analysts must cross-reference satellite SAR, severe meteorological conditions, and propulsion distress.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-risk-success shrink-0 mt-0.5" />
                <span><strong>Human-in-the-Loop:</strong> No automated interdiction or blacklisting is permitted without verified intelligence dossier review.</span>
              </div>
            </div>
          </div>
        </HudCornerFrame>

      </div>

      {/* Alert Tier Classification Table */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs font-bold text-white">
          <span className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <span>ANOMALY ALERT TIER TAXONOMY</span>
          </span>
          <span className="text-[10px] text-text-secondary font-mono">STANDARDIZED THRESHOLDS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-navy-card/80 text-text-secondary uppercase text-[10px] border-b border-navy-border">
                <th className="py-2.5 px-3">Tier Designation</th>
                <th className="py-2.5 px-3">Score Range</th>
                <th className="py-2.5 px-3">Operational Criteria</th>
                <th className="py-2.5 px-3">Mandated Analyst Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-border/50 text-[11px]">
              <tr className="hover:bg-navy-card/40">
                <td className="py-2.5 px-3 font-bold text-risk-alert flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-risk-alert animate-ping" />
                  <span>CRITICAL MONITORING</span>
                </td>
                <td className="py-2.5 px-3 font-mono text-white">≥ 0.6500</td>
                <td className="py-2.5 px-3 text-text-secondary">Multiple dark AIS gaps &gt; 12h, high-risk flag of convenience, confirmed STS rendezvous with draught increase.</td>
                <td className="py-2.5 px-3 text-risk-alert font-semibold">Immediate case file creation, satellite SAR cross-reference, port state notification.</td>
              </tr>
              <tr className="hover:bg-navy-card/40">
                <td className="py-2.5 px-3 font-bold text-risk-warning flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-risk-warning" />
                  <span>ELEVATED ATTENTION</span>
                </td>
                <td className="py-2.5 px-3 font-mono text-white">0.4500 – 0.6499</td>
                <td className="py-2.5 px-3 text-text-secondary">Recurring transmission lapses, elevated betweenness centrality linking disparate clusters, kinematic anomalies.</td>
                <td className="py-2.5 px-3 text-risk-warning">Secondary priority watchlisting; verify engine maintenance and weather logs.</td>
              </tr>
              <tr className="hover:bg-navy-card/40">
                <td className="py-2.5 px-3 font-bold text-accent-cyan flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-cyan" />
                  <span>MODERATE INTERACTION</span>
                </td>
                <td className="py-2.5 px-3 font-mono text-white">0.2500 – 0.4499</td>
                <td className="py-2.5 px-3 text-text-secondary">Occasional transit proximity with monitored vessels; single flag alteration; minor speed variance.</td>
                <td className="py-2.5 px-3 text-accent-cyan">Automated background monitoring; log in encounter registry.</td>
              </tr>
              <tr className="hover:bg-navy-card/40">
                <td className="py-2.5 px-3 font-bold text-risk-success flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-risk-success" />
                  <span>BASELINE LEGITIMATE</span>
                </td>
                <td className="py-2.5 px-3 font-mono text-white">&lt; 0.2500</td>
                <td className="py-2.5 px-3 text-text-secondary">Consistent AIS transmission, recognized flag registry, standard commercial routing, no evasive loitering.</td>
                <td className="py-2.5 px-3 text-text-secondary">No action required. Standard maritime traffic cataloging.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </HudCornerFrame>

    </div>
  );
}
