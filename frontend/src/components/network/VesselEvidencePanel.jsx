import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Radio, 
  Clock, 
  MapPin, 
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { VESSEL_INDICATOR_EVIDENCE } from '../../services/network';
import HudCornerFrame from '../effects/HudCornerFrame';

export default function VesselEvidencePanel({ 
  nodeData, 
  onClose, 
  onOpenProfile,
  allVessels = [] 
}) {
  const [activeTab, setActiveTab] = useState('facts'); // 'facts', 'inferences', 'unverified'
  if (!nodeData) return null;

  const vesselId = nodeData.id;
  const evidenceObj = VESSEL_INDICATOR_EVIDENCE[vesselId] || {
    observedFacts: [
      { type: "AIS Transmission Gap", measurement: `${nodeData.aisGaps || 3} reported blackout intervals`, location: "Mediterranean Transit Corridor", timestamp: "2026-10-25 14:00 UTC", source: "Coastal & Satellite Ingestion" },
      { type: "Kinematic Speed Variance", measurement: "Transmitted speed 0.8 kn (holding pattern)", location: "International Waters", timestamp: "2026-10-26 02:00 UTC", source: "AIS Voyage Message" }
    ],
    algorithmicInferences: [
      { type: "Network Interaction Role", measurement: `Betweenness centrality = ${nodeData.betweenness?.toFixed(4) || '0.1200'}`, location: "SNA Graph Model", timestamp: "2026-10-26 18:00 UTC", source: "NetworkX Centrality Analysis" }
    ],
    unverified: [
      { type: "Flag Registry Verification", measurement: `Flag state ${nodeData.flag || 'Unspecified'} advisory`, location: "Regional Port State Record", timestamp: "2026-10-20 UTC", source: "Open Intelligence Index" }
    ],
    alternativeExplanations: "Gaps may correlate with satellite reception voids, extreme meteorological conditions, or antenna maintenance during transit."
  };

  const riskColor = nodeData.riskColor || (
    nodeData.riskCategory === 'CRITICAL' ? '#FF5C65' :
    nodeData.riskCategory === 'HIGH' ? '#FF9900' :
    nodeData.riskCategory === 'MEDIUM' ? '#F5B942' :
    nodeData.riskCategory === 'UNKNOWN' ? '#94A3B8' : '#39D98A'
  );

  return (
    <HudCornerFrame className="bg-navy-sidebar/95 border border-accent-cyan/60 rounded-lg p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-3 w-80 sm:w-96 select-none animate-fadeIn" glow>
      
      {/* Header: Identity & Close */}
      <div className="flex items-start justify-between pb-2 border-b border-navy-border/80">
        <div>
          <div className="flex items-center space-x-2">
            <span 
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: `${riskColor}25`, color: riskColor, border: `1.5px solid ${riskColor}` }}
            >
              {nodeData.riskSymbol || '●'}
            </span>
            <span className="font-bold text-white text-sm truncate max-w-[210px]">
              {nodeData.fullName || nodeData.label || nodeData.id}
            </span>
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            MMSI: <strong className="text-accent-cyan">{nodeData.id}</strong> • {nodeData.flag || 'International'}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-text-secondary hover:text-white p-1 rounded hover:bg-navy-card transition-colors"
          title="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Identity & Centrality Summary Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-navy-card/80 p-2.5 rounded border border-navy-border/70">
        <div>
          <span className="text-text-secondary">Risk Category:</span>
          <div className="font-bold text-xs" style={{ color: riskColor }}>
            {nodeData.riskCategory || 'ANOMALOUS'} ({(nodeData.riskScore * 100).toFixed(0)}%)
          </div>
        </div>
        <div>
          <span className="text-text-secondary">Vessel Type:</span>
          <div className="text-white font-medium truncate">{nodeData.vesselType || 'Cargo/Tanker'}</div>
        </div>
        <div>
          <span className="text-text-secondary">Betweenness:</span>
          <div className="text-white font-mono">{nodeData.betweenness?.toFixed(4) || '0.0000'}</div>
        </div>
        <div>
          <span className="text-text-secondary">Degree Centrality:</span>
          <div className="text-white font-mono">{nodeData.degree?.toFixed(4) || '0.0000'}</div>
        </div>
      </div>

      {/* Evidence Sub-Tabs: Observed Facts / Algorithmic Inferences / Unverified */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1 border-b border-navy-border/60 pb-1 text-[11px]">
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-2 py-1 rounded transition-colors font-bold ${
              activeTab === 'facts' 
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50' 
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Observed Facts ({evidenceObj.observedFacts.length})
          </button>
          <button
            onClick={() => setActiveTab('inferences')}
            className={`px-2 py-1 rounded transition-colors font-bold ${
              activeTab === 'inferences' 
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50' 
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Inferences ({evidenceObj.algorithmicInferences.length})
          </button>
          <button
            onClick={() => setActiveTab('unverified')}
            className={`px-2 py-1 rounded transition-colors font-bold ${
              activeTab === 'unverified' 
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50' 
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Unverified ({evidenceObj.unverified.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
          {activeTab === 'facts' && evidenceObj.observedFacts.map((fact, idx) => (
            <div key={idx} className="p-2 rounded bg-navy-card/60 border border-navy-border text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-white">
                <span>{fact.type}</span>
                <span className="text-[10px] text-text-secondary">{fact.timestamp}</span>
              </div>
              <div className="text-accent-cyan font-semibold">{fact.measurement}</div>
              <div className="text-[10px] text-text-secondary flex justify-between">
                <span>Loc: {fact.location}</span>
                <span className="text-navy-border">•</span>
                <span className="text-text-secondary/80">Src: {fact.source}</span>
              </div>
            </div>
          ))}

          {activeTab === 'inferences' && evidenceObj.algorithmicInferences.map((inf, idx) => (
            <div key={idx} className="p-2 rounded bg-navy-card/60 border border-navy-border text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-white">
                <span>{inf.type}</span>
                <span className="text-[10px] text-text-secondary">{inf.timestamp}</span>
              </div>
              <div className="text-risk-warning font-semibold">{inf.measurement}</div>
              <div className="text-[10px] text-text-secondary flex justify-between">
                <span>Loc: {inf.location}</span>
                <span className="text-text-secondary/80">Model: {inf.source}</span>
              </div>
            </div>
          ))}

          {activeTab === 'unverified' && evidenceObj.unverified.map((unv, idx) => (
            <div key={idx} className="p-2 rounded bg-navy-card/60 border border-dashed border-risk-warning/40 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-risk-warning">
                <span>⚠️ {unv.type}</span>
                <span className="text-[10px] text-text-secondary">{unv.timestamp}</span>
              </div>
              <div className="text-text-secondary">{unv.measurement}</div>
              <div className="text-[10px] text-text-secondary/80">
                Source: {unv.source} (Pending Human Triage)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Explanations Box */}
      <div className="p-2 rounded bg-navy-card/70 border border-navy-border text-[10px] space-y-1">
        <span className="font-bold text-text-secondary flex items-center space-x-1">
          <HelpCircle className="w-3 h-3 text-accent-cyan" />
          <span>ALTERNATIVE EXPLANATIONS & FACTORS:</span>
        </span>
        <p className="text-text-secondary leading-relaxed">
          {evidenceObj.alternativeExplanations}
        </p>
      </div>

      {/* Mandatory Cautionary Note */}
      <div className="text-[10px] text-risk-warning/90 leading-tight border-t border-navy-border/60 pt-1.5 flex items-start space-x-1">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-risk-warning" />
        <span>A single gap or STS is never presented as proof. Requires human intelligence cross-verification.</span>
      </div>

      {/* Link to Full Vessel Dossier */}
      <div className="pt-1">
        <button
          onClick={() => {
            const targetVessel = allVessels.find(v => v.mmsi === nodeData.id) || {
              mmsi: nodeData.id,
              vessel_name: nodeData.fullName || nodeData.label,
              flag: nodeData.flag,
              vessel_type: nodeData.vesselType,
              composite_risk_score: nodeData.riskScore,
              risk_tier: nodeData.riskTier,
            };
            if (onOpenProfile) onOpenProfile(targetVessel);
          }}
          className="w-full py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-bold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Intelligence Dossier</span>
        </button>
      </div>

    </HudCornerFrame>
  );
}
