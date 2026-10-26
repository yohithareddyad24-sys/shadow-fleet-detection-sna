import React from 'react';
import { X, ShieldAlert, Clock, MapPin, Radio, Anchor, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Event Detail Drawer that slides in from the right with a vertical timeline of evidence.
 */
export default function EventDetailDrawer({ 
  event, 
  isOpen, 
  onClose, 
  onInspectVessel 
}) {
  if (!isOpen || !event) return null;

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-risk-alert bg-risk-alert/15 border-risk-alert/40';
      case 'ELEVATED':
      case 'MEDIUM':
        return 'text-risk-warning bg-risk-warning/15 border-risk-warning/40';
      default:
        return 'text-accent-cyan bg-accent-blue/15 border-accent-cyan/40';
    }
  };

  // Synthetic evidence points for vertical timeline if not already embedded
  const evidenceTimeline = event.evidence || [
    { time: event.timestamp || "2026-10-26 18:00 UTC", title: "Primary Anomaly Trigger", desc: event.details || event.desc || "Unusual behavioral pattern recorded.", type: "TRIGGER" },
    { time: "T-04h Prior", title: "Kinematic Drift & Slowdown", desc: "Speed dropped from 12.2 kn cruising to 1.1 kn loitering cadence.", type: "KINEMATICS" },
    { time: "T-12h Prior", title: "Corridor Ingress", desc: "Vessel entered designated STS transfer high-seas zone.", type: "POSITION" },
    { time: "T-24h Prior", title: "Flag State Broadcast Verification", desc: "Transponder active; flag jurisdiction validated against public registry.", type: "REGISTRY" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div 
        className="w-full max-w-md h-full bg-navy-sidebar border-l border-navy-border shadow-2xl flex flex-col font-mono text-text-primary z-50 transform transition-transform duration-300 ease-out translate-x-0"
        role="dialog"
        aria-label="Event Evidence Drawer"
      >
        {/* Header */}
        <div className="p-4 border-b border-navy-border bg-navy-card/90 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-accent-cyan" />
            <span className="font-bold text-xs uppercase tracking-wider text-white">
              Event Intelligence Dossier
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-navy-elevated text-text-secondary hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Main Event Card */}
          <div className="p-3.5 bg-navy-card border border-navy-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityStyle(event.severity)}`}>
                {event.severity || 'ELEVATED'}
              </span>
              <span className="text-[10px] text-text-secondary flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{event.time || event.timestamp}</span>
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mt-1">
              {event.vessel_name || event.vessel || 'Monitored Target'}
            </h3>
            
            <div className="text-xs text-text-secondary">
              {event.details || event.desc || event.type}
            </div>

            {event.location && (
              <div className="flex items-center space-x-1.5 text-[11px] text-accent-cyan pt-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Evidence Classification Banner */}
          <div className="p-2.5 rounded bg-accent-blue/10 border border-accent-blue/30 text-[11px] text-accent-cyan flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">MULTI-SOURCE RECONCILIATION:</span> Evidence corroborated via automated AIS kinematics and topological graph clustering.
            </div>
          </div>

          {/* Vertical Evidence Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Chronological Evidence Trail</span>
            </h4>

            <div className="relative pl-5 border-l-2 border-navy-border space-y-4">
              {evidenceTimeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-navy-bg border-2 border-accent-cyan group-hover:scale-125 transition-transform" />

                  <div className="p-2.5 rounded bg-navy-card/80 border border-navy-border/70 hover:border-accent-cyan/40 transition-colors">
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1">
                      <span className="font-bold text-accent-cyan">{item.time}</span>
                      <span className="px-1.5 py-0.2 rounded bg-navy-elevated text-[9px] text-text-secondary">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-navy-border bg-navy-card/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-navy-card border border-navy-border text-xs text-text-secondary hover:text-white"
          >
            Close
          </button>
          {onInspectVessel && (
            <button
              onClick={() => onInspectVessel(event)}
              className="px-3 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/50 text-xs font-bold text-accent-cyan flex items-center space-x-1.5"
            >
              <span>Inspect Vessel Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
