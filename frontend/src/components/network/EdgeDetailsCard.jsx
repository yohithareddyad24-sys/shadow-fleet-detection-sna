import React from 'react';
import { X, Share2, ShieldCheck, AlertTriangle, Clock, MapPin, Database } from 'lucide-react';
import HudCornerFrame from '../effects/HudCornerFrame';

export default function EdgeDetailsCard({ edgeData, onClose }) {
  if (!edgeData) return null;

  const isVerified = edgeData.isVerified !== false;

  return (
    <HudCornerFrame className="bg-navy-sidebar/95 border border-accent-cyan/60 rounded-lg p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-2.5 w-80 sm:w-96 select-none animate-fadeIn" glow>
      
      {/* Header */}
      <div className="flex items-start justify-between pb-2 border-b border-navy-border/80">
        <div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-accent-cyan" />
            <span className="font-bold text-white text-sm">
              RELATIONSHIP EVIDENCE
            </span>
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Node {edgeData.source} ↔ Node {edgeData.target}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-text-secondary hover:text-white p-1 rounded hover:bg-navy-card transition-colors"
          title="Close edge inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Relationship Type & Verification Status */}
      <div className="p-2.5 rounded bg-navy-card/80 border border-navy-border space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Type:</span>
          <span className="font-bold text-white font-mono uppercase">
            {edgeData.interactionType?.replace(/_/g, ' ') || 'INTERACTION'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Status:</span>
          {isVerified ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-success/20 text-risk-success border border-risk-success/40 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>VERIFIED EVIDENCE</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-risk-warning/20 text-risk-warning border border-risk-warning/40 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>UNVERIFIED PROXIMITY</span>
            </span>
          )}
        </div>

        {edgeData.duration > 0 && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Encounter Duration:</span>
            <span className="text-white font-bold">{edgeData.duration} hours</span>
          </div>
        )}

        {edgeData.count > 1 && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Repeated Events:</span>
            <span className="text-accent-cyan font-bold">{edgeData.count} interactions</span>
          </div>
        )}
      </div>

      {/* Evidence Documentation */}
      <div className="p-2.5 rounded bg-navy-card/60 border border-navy-border text-xs space-y-1">
        <span className="text-text-secondary font-bold text-[10px] uppercase">Documented Evidence:</span>
        <p className="text-white leading-relaxed text-[11px]">
          {edgeData.evidence || 'Operational proximity recorded in surveillance logs.'}
        </p>
      </div>

      {/* Timestamps & Source */}
      <div className="p-2 rounded bg-navy-card/60 border border-navy-border text-[10px] text-text-secondary space-y-1">
        <div className="flex justify-between">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-accent-cyan" />
            <span>First Detected:</span>
          </span>
          <span className="text-white">{edgeData.timestamps?.firstSeen || '2026-10-24 UTC'}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-accent-cyan" />
            <span>Last Observed:</span>
          </span>
          <span className="text-white">{edgeData.timestamps?.lastSeen || '2026-10-26 UTC'}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-navy-border/60">
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-accent-cyan" />
            <span>Source:</span>
          </span>
          <span className="text-accent-cyan truncate max-w-[190px]">{edgeData.sourceInfo || 'Coastal AIS & Radar Stream'}</span>
        </div>
      </div>

      {/* Strict Heuristic Rule */}
      <div className="text-[10px] text-text-secondary/80 leading-tight border-t border-navy-border/60 pt-1">
        <span>Evidence standard: Never infer common ownership from encounters or shared ports. Requires formal entity registry linkage.</span>
      </div>

    </HudCornerFrame>
  );
}
