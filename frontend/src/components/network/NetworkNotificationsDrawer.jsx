import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  Share2, 
  Activity, 
  ExternalLink,
  History,
  Filter
} from 'lucide-react';
import HudCornerFrame from '../effects/HudCornerFrame';

export default function NetworkNotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  onSelectVessel,
  eventHistory = [],
  demoSimulationActive,
  onToggleDemoSimulation,
  onTriggerSimulationStep
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'history'

  const filteredNotifications = notifications.filter(n => {
    if (filterSeverity === 'ALL') return true;
    return n.severity === filterSeverity;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-risk-alert/20 text-risk-alert border-risk-alert/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-risk-warning/20 text-risk-warning border-risk-warning/40';
      case 'LOW': return 'bg-risk-success/20 text-risk-success border-risk-success/40';
      default: return 'bg-accent-blue/20 text-accent-cyan border-accent-blue/40';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'new_high_risk':
      case 'risk_up':
      case 'risk_down':
        return <ShieldAlert className="w-3.5 h-3.5 text-risk-alert" />;
      case 'new_ais_gap':
        return <Radio className="w-3.5 h-3.5 text-risk-alert" />;
      case 'new_sts':
      case 'new_relationship':
        return <Share2 className="w-3.5 h-3.5 text-risk-warning" />;
      case 'centrality_shift':
        return <Activity className="w-3.5 h-3.5 text-accent-cyan" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-accent-cyan" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 z-40 bg-navy-sidebar/95 border-l border-navy-border shadow-2xl backdrop-blur-md flex flex-col font-mono text-xs select-none animate-slideInRight">
      
      {/* Top Header */}
      <div className="p-3 border-b border-navy-border/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-accent-cyan" />
          <span className="font-bold text-white text-sm">SURVEILLANCE ALERTS</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-risk-alert text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-text-secondary hover:text-white p-1 rounded hover:bg-navy-card transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs: Notifications vs Event History */}
      <div className="px-3 pt-2 pb-1 border-b border-navy-border/60 flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Live Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors flex items-center space-x-1 ${
              activeTab === 'history'
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Event History ({eventHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Severity Filters & Actions (for notifications) */}
      {activeTab === 'notifications' && (
        <div className="p-2.5 bg-navy-card/60 border-b border-navy-border/60 flex flex-wrap items-center justify-between gap-1 text-[11px]">
          {/* Filters */}
          <div className="flex items-center space-x-1">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  filterSeverity === sev
                    ? 'bg-accent-cyan text-navy-bg border-accent-cyan'
                    : 'bg-navy-sidebar text-text-secondary border-navy-border hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Action Buttons: Mark Read / Clear */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onMarkAllRead}
              className="p-1 rounded text-text-secondary hover:text-accent-cyan"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearNotifications}
              className="p-1 rounded text-text-secondary hover:text-risk-alert"
              title="Clear notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Simulation Bar */}
      <div className="px-3 py-2 bg-navy-card/40 border-b border-navy-border/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-text-secondary">DEMO Dynamic Feed:</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onTriggerSimulationStep}
            className="px-2 py-0.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-bold text-[10px]"
            title="Inject simulated dynamic graph event"
          >
            + Ingest Event
          </button>
          <button
            onClick={onToggleDemoSimulation}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              demoSimulationActive
                ? 'bg-risk-warning/20 text-risk-warning border-risk-warning/40'
                : 'bg-navy-card text-text-secondary border-navy-border'
            }`}
          >
            {demoSimulationActive ? 'Auto: ON' : 'Auto: OFF'}
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'notifications' ? (
          filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              No notifications matching current filter.
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`p-2.5 rounded border transition-colors space-y-1.5 cursor-pointer ${
                  notif.isRead 
                    ? 'bg-navy-card/50 border-navy-border opacity-70 hover:opacity-100' 
                    : 'bg-navy-card border-navy-border hover:border-accent-cyan/60'
                }`}
                onClick={() => onSelectVessel && onSelectVessel({ mmsi: notif.vesselId, vessel_name: notif.vesselName })}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center space-x-1.5 font-bold text-white text-[11px]">
                    {getTypeIcon(notif.type)}
                    <span className="truncate">{notif.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${getSeverityStyle(notif.severity)}`}>
                    {notif.severity}
                  </span>
                </div>

                <p className="text-text-secondary text-[11px] leading-tight">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-text-secondary pt-1 border-t border-navy-border/40">
                  <span className="text-accent-cyan font-mono">[{notif.vesselId}] {notif.vesselName}</span>
                  <span>{notif.timestamp}</span>
                </div>
              </div>
            ))
          )
        ) : (
          /* Event History Log */
          eventHistory.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              No graph modification events logged yet.
            </div>
          ) : (
            eventHistory.map((hist, idx) => (
              <div key={idx} className="p-2.5 rounded bg-navy-card/70 border border-navy-border text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>{hist.action}</span>
                  <span className="text-[10px] text-text-secondary">{hist.timestamp}</span>
                </div>
                <div className="text-accent-cyan">{hist.description}</div>
                {hist.prevCategory && hist.newCategory && (
                  <div className="text-[10px] text-text-secondary flex items-center space-x-1 pt-0.5">
                    <span>Shift:</span>
                    <span className="text-risk-warning font-bold">{hist.prevCategory}</span>
                    <span>→</span>
                    <span className="text-risk-alert font-bold">{hist.newCategory}</span>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-2.5 border-t border-navy-border/80 bg-navy-card/40 text-[10px] text-text-secondary/80 text-center">
        Surveillance notifications are heuristic triggers for analyst triage.
      </div>

    </div>
  );
}
