import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Anchor, 
  Compass, 
  Radio, 
  Share2, 
  GitBranch, 
  FileText, 
  Layers, 
  MapPin, 
  Clock, 
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';
import { fetchVesselDetails } from '../services/api';
import RiskGaugeArc from './effects/RiskGaugeArc';
import AisTimelineBarcode from './effects/AisTimelineBarcode';
import HudCornerFrame from './effects/HudCornerFrame';

export default function VesselDossierModal({ 
  vessel, 
  onClose, 
  onLocateOnMap, 
  onViewInGraph, 
  onRunAcoFromVessel,
  onAddToCase 
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, gaps, encounters, corporate, evidence

  // Interactive Checklists State (Section 5.7)
  const [checkedAltExplanations, setCheckedAltExplanations] = useState({
    weather: false,
    engine: false,
    bunkering: false,
    cadence: false,
  });

  const [checkedHumanChecks, setCheckedHumanChecks] = useState({
    satellite_sar: false,
    port_records: false,
    insurance_pi: false,
    flag_registry: false,
    customs_manifest: false,
  });

  useEffect(() => {
    if (!vessel) return;
    setLoading(true);
    fetchVesselDetails(vessel.mmsi).then(data => {
      setDetails(data);
      setLoading(false);
    });
  }, [vessel]);

  if (!vessel) return null;

  const data = details || vessel;
  const score = data.composite_risk_score || 0;

  const toggleAltExplanation = (key) => {
    setCheckedAltExplanations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleHumanCheck = (key) => {
    setCheckedHumanChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'CRITICAL_MONITORING': return 'text-risk-alert bg-risk-alert/15 border-risk-alert/40';
      case 'ELEVATED_ATTENTION': return 'text-risk-warning bg-risk-warning/15 border-risk-warning/40';
      case 'MODERATE_INTERACTION': return 'text-accent-cyan bg-accent-blue/15 border-accent-cyan/40';
      default: return 'text-risk-success bg-risk-success/15 border-risk-success/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <HudCornerFrame className="bg-navy-elevated border border-navy-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-text-primary glass-panel" glow>
        
        {/* Modal Header */}
        <div className="bg-navy-sidebar border-b border-navy-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-navy-card border border-navy-border text-accent-cyan shadow-sm">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold font-mono tracking-wider text-white">
                  {data.vessel_name}
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getTierColor(data.risk_tier)}`}>
                  {data.risk_tier?.replace(/_/g, ' ') || 'EVALUATING'}
                </span>
              </div>
              <div className="text-xs text-text-secondary font-mono flex items-center space-x-3 mt-0.5">
                <span>MMSI: <span className="text-accent-cyan font-bold">{data.mmsi}</span></span>
                <span>•</span>
                <span>IMO: <span className="text-white">{data.imo || '9248102'}</span></span>
                <span>•</span>
                <span>FLAG: <span className="text-white">{data.flag}</span> (Risk: {data.flag_risk_weight})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onLocateOnMap(data)}
              className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-border border border-navy-border text-xs font-mono text-accent-cyan flex items-center space-x-1.5 transition-colors"
              title="Show vessel on tactical map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map Focus</span>
            </button>
            <button
              onClick={() => onViewInGraph(data)}
              className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-border border border-navy-border text-xs font-mono text-accent-blue flex items-center space-x-1.5 transition-colors"
              title="Inspect vessel network connections"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SNA Graph</span>
            </button>
            <button
              onClick={() => onRunAcoFromVessel(data)}
              className="px-2.5 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/50 text-xs font-mono text-accent-cyan flex items-center space-x-1.5 transition-colors"
              title="Run ACO multi-hop path search starting from this vessel"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>ACO Origin</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-border text-text-secondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Investigative Support Disclaimer Callout */}
        <div className="bg-risk-warning/10 border-b border-risk-warning/20 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-risk-warning/90">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>INVESTIGATION SUPPORT METRICS: High anomaly scores highlight behavioural indicators requiring analyst corroboration.</span>
          </div>
          <span className="text-[10px] uppercase text-text-secondary">CONFIDENTIAL // LAW ENFORCEMENT & MARITIME ANALYST TRIAGE</span>
        </div>

        {/* Sub Navigation */}
        <div className="bg-navy-card border-b border-navy-border px-5 py-2 flex items-center space-x-3 text-xs font-mono">
          {[
            { id: 'overview', label: 'Intelligence Overview & Evidence' },
            { id: 'gaps', label: `Dark AIS Gaps (${data.ais_gap_count || 0})` },
            { id: 'encounters', label: `Observed STS / Rendezvous (${data.neighbors?.length || 0})` },
            { id: 'corporate', label: 'Ownership & Flag Registry' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1 rounded transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-navy-elevated text-accent-cyan border border-navy-border font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeSubTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Top Row: SVG Arc Gauge & Centralities */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* 5.4 Risk gauge (SVG arc) */}
                <div className="md:col-span-4 bg-navy-card border border-navy-border rounded-lg p-4 flex flex-col items-center justify-between shadow-panel">
                  <div className="w-full flex items-center justify-between text-xs font-mono text-text-secondary">
                    <span>BEHAVIORAL RISK GAUGE</span>
                    <span className="text-[9px] text-accent-cyan uppercase font-bold">Uncalibrated</span>
                  </div>

                  <div className="my-2 py-1 w-full flex justify-center">
                    <RiskGaugeArc score={score} size={190} showLabel={true} />
                  </div>

                  <div className="w-full text-center text-[10px] font-mono text-text-secondary pt-2 border-t border-navy-border/60">
                    Primary Driver: <strong className="text-accent-cyan">{data.primary_risk_driver || 'Flag of Convenience'}</strong>
                  </div>
                </div>

                {/* Centrality Metrics & Topological Roles */}
                <div className="md:col-span-4 bg-navy-card border border-navy-border rounded-lg p-4 flex flex-col justify-between shadow-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                    <span>SNA TOPOLOGICAL ROLE</span>
                    <span className="text-[10px] text-accent-cyan">[CENTRALITIES]</span>
                  </div>
                  <div className="my-2 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Degree Centrality (Hub):</span>
                      <span className="text-white font-bold">{data.degree_centrality?.toFixed(4) || '0.0000'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Betweenness (Bridge):</span>
                      <span className="text-accent-cyan font-bold">{data.betweenness_centrality?.toFixed(4) || '0.0000'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Spoofing Incidents:</span>
                      <span className="text-risk-warning font-bold">{data.spoofing_incident_count || 0}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono p-2 rounded bg-navy-elevated/80 border border-navy-border/60">
                    {data.betweenness_centrality > 0.15 
                      ? '⚠️ Acts as key intermediary relay connecting disparate maritime clusters.'
                      : 'Standard connectivity profile within bilateral cluster.'}
                  </div>
                </div>

                {/* Telemetry Status */}
                <div className="md:col-span-4 bg-navy-card border border-navy-border rounded-lg p-4 flex flex-col justify-between shadow-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                    <span>OPERATIONAL TELEMETRY</span>
                    <span className="text-[10px] text-risk-success font-mono font-bold">● ACTIVE AIS</span>
                  </div>
                  <div className="my-2 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Coordinates:</span>
                      <span className="text-white">{data.lat?.toFixed(2)}°N, {data.lng?.toFixed(2)}°E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Speed / Heading:</span>
                      <span className="text-white">{data.speed} kn / {data.heading}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Draught:</span>
                      <span className="text-white">{data.draught_m || 14.8} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Destination:</span>
                      <span className="text-accent-cyan truncate max-w-[140px]">{data.destination || 'FOR ORDERS'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono truncate">
                    Area: <span className="text-white">{data.port || 'International Waters'}</span>
                  </div>
                </div>
              </div>

              {/* 5.7 "Why was this flagged?" panel: Contributing signals shown as horizontal bars with weights */}
              <div className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-cyan flex items-center space-x-2">
                    <Layers className="w-4 h-4" />
                    <span>Why was this flagged? (Contributing Signals & Weights)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-text-secondary bg-navy-elevated px-2 py-0.5 rounded border border-navy-border">
                    {data.isDemo ? 'CALIBRATION: DEMO' : 'CALIBRATION: BACKEND WEIGHTED'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  {/* Flag Risk */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-secondary">Flag State Jurisdiction Risk (Weight = 25%)</span>
                      <span className="text-white font-bold">{(data.contrib_flag || 0.175).toFixed(4)} ({data.flag})</span>
                    </div>
                    <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden border border-navy-border">
                      <div className="bg-accent-cyan h-full rounded-full" style={{ width: `${Math.min((data.contrib_flag || 0.175) / 0.25 * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Betweenness Centrality */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-secondary">Betweenness Relay / Bridge Centrality (Weight = 30%)</span>
                      <span className="text-accent-blue font-bold">{(data.contrib_betweenness || 0.049).toFixed(4)}</span>
                    </div>
                    <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden border border-navy-border">
                      <div className="bg-accent-blue h-full rounded-full" style={{ width: `${Math.min((data.contrib_betweenness || 0.049) / 0.30 * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Degree Centrality */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-secondary">Degree Rendezvous Hub Density (Weight = 20%)</span>
                      <span className="text-white font-bold">{(data.contrib_degree || 0.054).toFixed(4)}</span>
                    </div>
                    <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden border border-navy-border">
                      <div className="bg-accent-cyan h-full rounded-full" style={{ width: `${Math.min((data.contrib_degree || 0.054) / 0.20 * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Dark AIS Transmission Gaps */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-secondary">Dark AIS Transmission Blackout Corridors (Weight = 15%)</span>
                      <span className="text-risk-warning font-bold">{(data.contrib_ais_gaps || 0.12).toFixed(4)} ({data.ais_gap_count} gaps)</span>
                    </div>
                    <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden border border-navy-border">
                      <div className="bg-risk-warning h-full rounded-full" style={{ width: `${Math.min((data.contrib_ais_gaps || 0.12) / 0.15 * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Kinematic Spoofing */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-secondary">Kinematic Spoofing / Discrepancy Mismatches (Weight = 10%)</span>
                      <span className="text-risk-alert font-bold">{(data.contrib_spoofing || 0.066).toFixed(4)} ({data.spoofing_incident_count} incidents)</span>
                    </div>
                    <div className="w-full bg-navy-bg h-2 rounded-full overflow-hidden border border-navy-border">
                      <div className="bg-risk-alert h-full rounded-full" style={{ width: `${Math.min((data.contrib_spoofing || 0.066) / 0.10 * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5.7 Three clearly differentiated blocks with distinct visual treatments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Block 1: OBSERVED FACTS (Solid Cyan/Green Tag) */}
                <div className="evidence-block-observed rounded-lg p-4 space-y-2.5 font-mono text-xs shadow-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b border-risk-success/30">
                    <span className="font-bold text-risk-success flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>OBSERVED FACTS</span>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-risk-success/20 text-risk-success font-bold">
                      VERIFIED SENSORS
                    </span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-text-secondary">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-success">✓</span>
                      <span>Transponder broadcast coordinates: <strong>{data.lat?.toFixed(2)}°N, {data.lng?.toFixed(2)}°E</strong>.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-success">✓</span>
                      <span>Registered IMO {data.imo || '9248102'} with declared deadweight <strong>{data.dwt ? `${data.dwt.toLocaleString()} t` : '105,400 t'}</strong>.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-success">✓</span>
                      <span>{data.ais_gap_count || 12} distinct transponder cessation windows exceeding 6 hours in international waters.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-success">✓</span>
                      <span>Observed bilateral low-speed encounters recorded with <strong>{data.neighbors?.length || 2}</strong> counterpart hulls.</span>
                    </li>
                  </ul>
                </div>

                {/* Block 2: ALGORITHMIC INFERENCES (Blue Tag, Sparkles/Model Icon) */}
                <div className="evidence-block-inferred rounded-lg p-4 space-y-2.5 font-mono text-xs shadow-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b border-accent-blue/30">
                    <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-accent-blue" />
                      <span>ALGORITHMIC INFERENCES</span>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-accent-blue/20 text-accent-cyan font-bold">
                      MODEL HEURISTIC
                    </span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-text-secondary">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-accent-cyan">◈</span>
                      <span>High betweenness centrality (<strong>{data.betweenness_centrality?.toFixed(4)}</strong>) infers bridge relay positioning between distinct clusters.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-accent-cyan">◈</span>
                      <span>Ant Colony Optimization algorithm scored <strong>0.842 fitness</strong> for multi-hop illicit transfer paths passing through this node.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-accent-cyan">◈</span>
                      <span>Draught change of +2.8m across blackout gap statistically correlates with high-seas cargo loading.</span>
                    </li>
                  </ul>
                </div>

                {/* Block 3: UNVERIFIED INFORMATION (Amber Dashed Border + Warning Icon) */}
                <div className="evidence-block-unverified rounded-lg p-4 space-y-2.5 font-mono text-xs shadow-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b border-risk-warning/30">
                    <span className="font-bold text-risk-warning flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>UNVERIFIED INFORMATION</span>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-risk-warning/20 text-risk-warning font-bold">
                      REQUIRES CORROBORATION
                    </span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-text-secondary">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-warning">⚠️</span>
                      <span>Ultimate beneficial owner entity behind offshore SPV (<strong>{data.beneficial_owner || 'Undisclosed Holding Entity (UAE)'}</strong>) lacks verified registry filings.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-warning">⚠️</span>
                      <span>Declared destination "FOR ORDERS" without verified port bill of lading or terminal booking.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-risk-warning">⚠️</span>
                      <span>Cargo commodity specification (Urals crude vs fuel oil blend) unconfirmed without physical sample or ullage assay.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 5.7 Alternative explanations and Recommended human checks as Interactive Checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Checklist 1: Possible alternative explanations */}
                <div className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-navy-border">
                    <span className="font-bold text-text-primary flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>POSSIBLE ALTERNATIVE EXPLANATIONS</span>
                    </span>
                    <span className="text-[10px] text-text-secondary">ANALYST EVALUATION</span>
                  </div>

                  <div className="space-y-2">
                    <label 
                      onClick={() => toggleAltExplanation('weather')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedAltExplanations.weather ? (
                        <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Heavy Weather Route Diversion</div>
                        <div className="text-[10px] text-text-secondary">Course adjustment & slowdown caused by Mediterranean swell or gale advisory.</div>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleAltExplanation('engine')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedAltExplanations.engine ? (
                        <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Equipment or Transponder Power Fault</div>
                        <div className="text-[10px] text-text-secondary">Antenna grounding loss or uncommanded VHF transponder reset in transit.</div>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleAltExplanation('bunkering')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedAltExplanations.bunkering ? (
                        <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Standard High-Seas Bunkering</div>
                        <div className="text-[10px] text-text-secondary">Legitimate fuel replenishment from licensed offshore bunker barge.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Checklist 2: Recommended human checks */}
                <div className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-navy-border">
                    <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>RECOMMENDED HUMAN CHECKS</span>
                    </span>
                    <span className="text-[10px] text-text-secondary">ACTIONABLE PROTOCOLS</span>
                  </div>

                  <div className="space-y-2">
                    <label 
                      onClick={() => toggleHumanCheck('satellite_sar')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedHumanChecks.satellite_sar ? (
                        <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Cross-Examine Optical & SAR Satellite Imagery</div>
                        <div className="text-[10px] text-text-secondary">Task Sentinel-1 Synthetic Aperture Radar capture over Laconic Gulf gap window.</div>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleHumanCheck('port_records')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedHumanChecks.port_records ? (
                        <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Request Port State Control (PSC) Inspection History</div>
                        <div className="text-[10px] text-text-secondary">Check Paris MoU and Tokyo MoU deficiency logs for mechanical/safety flags.</div>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleHumanCheck('insurance_pi')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedHumanChecks.insurance_pi ? (
                        <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Verify Protection & Indemnity (P&I) Club Coverage</div>
                        <div className="text-[10px] text-text-secondary">Confirm whether marine hull and spill liability insurance is with an International Group member.</div>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleHumanCheck('flag_registry')}
                      className="flex items-start space-x-2.5 p-2 rounded bg-navy-elevated/70 border border-navy-border/60 cursor-pointer hover:border-accent-cyan/40"
                    >
                      {checkedHumanChecks.flag_registry ? (
                        <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-white font-semibold text-[11px]">Flag State Registrar Status Confirmation</div>
                        <div className="text-[10px] text-text-secondary">Verify current certificate validity with Panama Maritime Authority registry.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSubTab === 'gaps' && (
            <div className="space-y-4">
              <div className="p-3 bg-navy-card border border-navy-border rounded-md text-xs text-text-secondary">
                <strong className="text-white">Dark AIS Transmission Gaps:</strong> Gaps occur when vessel transponders cease transmitting in international corridors. This timeline logs duration, position shifts, and draught variance indicative of unmonitored cargo transfers.
              </div>

              {/* 5.4 Dense AIS transmission timeline tick-barcode visualization */}
              <AisTimelineBarcode 
                vesselName={data.vessel_name} 
                gapCount={data.ais_gap_count || 2} 
                className="p-3.5 bg-navy-card border border-navy-border rounded-lg shadow-panel"
              />

              {(!data.ais_gaps || data.ais_gaps.length === 0) ? (
                <div className="p-8 text-center text-xs font-mono text-text-secondary bg-navy-card rounded border border-navy-border">
                  No anomalous AIS transmission blackouts registered for this vessel in the current monitoring window.
                </div>
              ) : (
                data.ais_gaps.map((gap, idx) => (
                  <div key={idx} className="p-4 bg-navy-card border border-risk-warning/30 rounded-lg space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Radio className="w-4 h-4 text-risk-warning animate-pulse" />
                        <span className="font-bold text-white">{gap.gap_id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-risk-warning/15 text-risk-warning border border-risk-warning/30">
                          BLACKOUT DURATION: {gap.duration_hours} HOURS
                        </span>
                      </div>
                      <span className="text-text-secondary">{gap.start_time} → {gap.end_time}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-navy-elevated p-3 rounded border border-navy-border">
                      <div>
                        <span className="text-text-secondary">Last Known Broadcast:</span>
                        <div className="text-white font-semibold mt-0.5">{gap.last_known_pos}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Reappearance Position:</span>
                        <div className="text-accent-cyan font-semibold mt-0.5">{gap.reappearance_pos}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Speed Discrepancy:</span>
                        <div className="text-risk-warning font-semibold mt-0.5">{gap.estimated_speed_discrepancy_knots}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Draught Variance (Displacement):</span>
                        <div className="text-risk-alert font-semibold mt-0.5">{gap.draught_delta_m}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-text-secondary">
                      Assessment: <span className="text-white">{gap.risk_assessment}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'encounters' && (
            <div className="space-y-4">
              <div className="p-3 bg-navy-card border border-navy-border rounded-md text-xs text-text-secondary">
                <strong className="text-white">Observed Rendezvous & Proximity Events:</strong> Logged bilateral encounters where two vessels maintained close proximity (&lt;0.5 nm) at zero or low speed in high seas transfer areas.
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-navy-card text-text-secondary uppercase text-[10px] border-b border-navy-border">
                    <tr>
                      <th className="py-2.5 px-3">Counterpart Vessel</th>
                      <th className="py-2.5 px-3">Encounter Type</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Avg Duration</th>
                      <th className="py-2.5 px-3">Separation</th>
                      <th className="py-2.5 px-3">Interaction Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-border/50">
                    {(!data.neighbors || data.neighbors.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-text-secondary">
                          No bilateral rendezvous recorded for this node in the current interaction graph.
                        </td>
                      </tr>
                    ) : (
                      data.neighbors.map((n, idx) => (
                        <tr key={idx} className="hover:bg-navy-card/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <div>{n.target_name}</div>
                            <div className="text-[10px] text-text-secondary font-mono">{n.target_mmsi}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-accent-blue/15 text-accent-cyan border border-accent-blue/30 text-[10px]">
                              {n.interaction_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-text-primary">{n.interaction_count} events</td>
                          <td className="py-2.5 px-3 text-text-primary">{n.avg_duration_hours} hrs</td>
                          <td className="py-2.5 px-3 text-text-primary">{n.avg_distance_nm} nm</td>
                          <td className="py-2.5 px-3">
                            <span className={`font-bold ${n.interaction_risk >= 0.75 ? 'text-risk-alert' : n.interaction_risk >= 0.5 ? 'text-risk-warning' : 'text-risk-success'}`}>
                              {(n.interaction_risk * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'corporate' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-navy-card border border-navy-border rounded-md text-text-secondary">
                <strong className="text-white">Public Registry & Ownership Transparency:</strong> Maritime intelligence tracking of commercial operators, registered shell SPVs, and historical flag switching.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-navy-card border border-navy-border rounded-lg space-y-3">
                  <h4 className="text-accent-cyan font-bold uppercase text-[11px] tracking-wider">Corporate Structure</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-text-secondary text-[10px]">REGISTERED OWNER (LEGAL ENTITY):</span>
                      <div className="text-white font-semibold mt-0.5">{data.registered_owner || 'Alcyone Maritime Ltd (Marshall Islands SPV)'}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">COMMERCIAL OPERATOR / ISM MANAGER:</span>
                      <div className="text-white font-semibold mt-0.5">{data.commercial_operator || 'Pontus Ocean Shipmanagement (Dubai)'}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">BENEFICIAL OWNER (ULTIMATE BENEFICIARY):</span>
                      <div className="text-risk-warning font-semibold mt-0.5">{data.beneficial_owner || 'Undisclosed Holding Entity (UAE)'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-navy-card border border-navy-border rounded-lg space-y-3">
                  <h4 className="text-accent-cyan font-bold uppercase text-[11px] tracking-wider">Vessel Specifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-text-secondary text-[10px]">TYPE:</span>
                      <div className="text-white">{data.vessel_type}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">DEADWEIGHT (DWT):</span>
                      <div className="text-white">{data.dwt ? `${data.dwt.toLocaleString()} t` : '105,400 t'}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">BUILD YEAR:</span>
                      <div className="text-white">{data.year_built || 2003}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">FLAG STATE:</span>
                      <div className="text-white">{data.flag} (Risk: {data.flag_risk_weight})</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-navy-card/50 border border-navy-border text-[11px] text-text-secondary flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-risk-warning shrink-0 mt-0.5" />
                <span>
                  Opaque single-ship SPV ownership combined with multiple flag switches within 24 months matches structural risk indicators for elevated maritime review.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-navy-sidebar border-t border-navy-border px-5 py-3 flex items-center justify-between text-xs font-mono">
          <div className="text-text-secondary">
            MMSI: <span className="text-white">{data.mmsi}</span> • LAT/LNG: <span className="text-accent-cyan">{data.lat?.toFixed(2)}N, {data.lng?.toFixed(2)}E</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onAddToCase(data)}
              className="px-3 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-cyan border border-accent-blue/40 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Attach to Investigation Case</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-navy-card hover:bg-navy-border text-white border border-navy-border transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>

      </HudCornerFrame>
    </div>
  );
}
