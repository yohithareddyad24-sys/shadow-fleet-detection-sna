import React from 'react';
import { Clock, Radio, AlertTriangle, ShieldAlert } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';

export default function ThreatFeed({ events = [], onSelectMmsi, isDemo = false }) {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-risk-alert/20 text-risk-alert border-risk-alert/40';
      case 'ELEVATED': return 'bg-risk-warning/20 text-risk-warning border-risk-warning/40';
      default: return 'bg-accent-blue/20 text-accent-cyan border-accent-blue/40';
    }
  };

  return (
    <div className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel font-mono text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-navy-border">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-bold text-white text-xs uppercase tracking-wider">
            Operational Surveillance Feed & Anomaly Stream
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isDemo && <DemoBadge />}
          <span className="text-[10px] text-accent-cyan font-bold animate-pulse">
            ● STREAMING
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="py-8 text-center text-text-secondary text-xs">
            No active threat events reported in current surveillance window.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectMmsi && onSelectMmsi(evt.mmsi)}
              className="p-2.5 rounded bg-navy-card/80 border border-navy-border flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-navy-elevated cursor-pointer transition-colors"
            >
              <div className="flex items-start md:items-center space-x-2.5">
                <span className="text-[10px] text-text-secondary shrink-0">{evt.timestamp}</span>
                <span className="font-bold text-accent-cyan shrink-0">{evt.vessel_name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-elevated border border-navy-border text-text-primary shrink-0">
                  {evt.event_type}
                </span>
                <span className="text-[11px] text-text-secondary truncate max-w-lg">
                  {evt.details}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] text-text-secondary">{evt.location}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${getSeverityStyle(evt.severity)}`}>
                  {evt.severity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
