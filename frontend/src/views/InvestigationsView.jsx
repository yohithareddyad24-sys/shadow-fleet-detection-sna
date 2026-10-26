import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderLock, 
  Plus, 
  FileText, 
  ShieldAlert, 
  Clock, 
  Ship, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  FileDown,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Archive,
  RefreshCw
} from 'lucide-react';
import { 
  fetchInvestigationCases, 
  createInvestigationCase, 
  updateInvestigationCase, 
  addCaseNote 
} from '../services/api';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function InvestigationsView({ 
  vessels = [], 
  onSelectVessel,
  selectedVesselForCase,
  onClearVesselForCase
}) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Case Expansion & Inline Note Logging
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});

  // New Case Form
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [selectedMmsis, setSelectedMmsis] = useState(selectedVesselForCase ? [selectedVesselForCase.mmsi] : []);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInvestigationCases().then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedVesselForCase) {
      setSelectedMmsis([selectedVesselForCase.mmsi]);
      setTitle(`Investigation Dossier: ${selectedVesselForCase.vessel_name}`);
      setShowNewModal(true);
    }
  }, [selectedVesselForCase]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCase = await createInvestigationCase({
      title,
      priority,
      vessels: selectedMmsis,
      notes,
    });

    setCases([newCase, ...cases]);
    setShowNewModal(false);
    setTitle('');
    setNotes('');
    if (onClearVesselForCase) onClearVesselForCase();
  };

  const handleStatusChange = async (caseId, newStatus) => {
    await updateInvestigationCase(caseId, { status: newStatus });
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
  };

  const handleAddNote = async (caseId) => {
    const text = noteInputs[caseId]?.trim();
    if (!text) return;

    const updated = await addCaseNote(caseId, text, 'Analyst Lead');
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, ...updated } : c));
    setNoteInputs(prev => ({ ...prev, [caseId]: '' }));
  };

  // Filtered Cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !searchQuery ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.analyst.toLowerCase().includes(q) ||
        c.vessels.some(m => m.includes(q));

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [cases, searchQuery, statusFilter, priorityFilter]);

  // Export as structured JSON dossier
  const exportCaseJson = (c) => {
    const report = {
      case_id: c.id,
      title: c.title,
      classification: "UNCLASSIFIED // INVESTIGATION SUPPORT ONLY",
      created_at: c.created_at,
      status: c.status,
      priority: c.priority,
      analyst: c.analyst,
      vessels_under_review: c.vessels.map(mmsi => {
        const v = vessels.find(item => item.mmsi === mmsi);
        return v ? {
          mmsi: v.mmsi,
          name: v.vessel_name,
          flag: v.flag,
          type: v.vessel_type,
          risk_score: v.composite_risk_score,
          risk_tier: v.risk_tier,
          lat: v.lat,
          lng: v.lng,
          port: v.port,
        } : { mmsi };
      }),
      investigative_notes: c.notes,
      chronological_log: c.log_entries || [],
      standard_notice: "Exploratory triage metric findings. Requires official corroboration before legal determination.",
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.id}_investigation_dossier.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export as formatted Markdown Executive Brief
  const exportCaseExecutiveBrief = (c) => {
    const vesselRows = c.vessels.map(mmsi => {
      const v = vessels.find(item => item.mmsi === mmsi);
      return `| ${mmsi} | ${v?.vessel_name || 'UNKNOWN'} | ${v?.flag || 'UNKNOWN'} | ${v?.vessel_type || 'Tanker'} | ${v ? (v.composite_risk_score * 100).toFixed(1) + '%' : 'N/A'} | ${v?.risk_tier || 'N/A'} |`;
    }).join('\n');

    const logRows = (c.log_entries || [
      { timestamp: c.created_at, author: c.analyst, note: c.notes }
    ]).map(l => `- **[${l.timestamp}] (${l.author})**: ${l.note}`).join('\n');

    const markdownContent = `# EXECUTIVE MARITIME INTELLIGENCE DOSSIER
**CASE IDENTIFIER**: ${c.id}  
**SECURITY CLASSIFICATION**: UNCLASSIFIED // MARITIME SAFETY & SURVEILLANCE SUPPORT  
**GENERATED ON**: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC  
**LEAD OPERATIONAL ANALYST**: ${c.analyst}  
**CURRENT STATUS**: ${c.status}  
**ASSIGNED PRIORITY**: ${c.priority}  

---

## 1. Executive Summary
**Incident Title**: ${c.title}  
**Entity Count**: ${c.vessels.length} vessel(s) flagged for loitering, dark AIS transponder gaps, or bilateral Ship-to-Ship (STS) transfer rendezvous.

---

## 2. Monitored Vessels Under Review
| MMSI | Vessel Name | Flag | Category | Composite Risk | Risk Tier |
|---|---|---|---|---|---|
${vesselRows}

---

## 3. Chronological Operational Logs & Evidence
${logRows}

---

## 4. Mandatory Evidentiary Standard Notice
> **DISCLAIMER**:  
> All metrics and network path outputs represent exploratory algorithmic triage heuristics (Social Network Analysis Centrality and Ant Colony Optimization). Findings do NOT constitute legal proof of sanctions evasion, shadow fleet participation, or illicit maritime trade. Independent human verification (satellite SAR imagery, customs manifests, physical port inspection) is strictly required prior to any regulatory or interdiction action.
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.id}_executive_brief.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN_INVESTIGATION':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40">OPEN</span>;
      case 'IN_REVIEW':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-risk-warning/20 text-risk-warning border-risk-warning/40">IN REVIEW</span>;
      case 'RESOLVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-risk-success/20 text-risk-success border-risk-success/40">RESOLVED</span>;
      case 'ARCHIVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-slate-500/20 text-slate-400 border-slate-500/40">ARCHIVED</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-navy-border text-text-secondary">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-risk-alert/20 text-risk-alert border-risk-alert/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-risk-alert/15 text-risk-alert border-risk-alert/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-risk-warning/20 text-risk-warning border-risk-warning/40">MEDIUM</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-accent-blue/20 text-accent-cyan border-accent-blue/40">LOW</span>;
    }
  };

  return (
    <div className="w-full h-full bg-navy-bg p-4 flex flex-col overflow-y-auto font-mono text-text-primary select-none space-y-4">
      
      {/* Title & Action Header */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-3 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
            <FolderLock className="w-4 h-4" />
            <span>INVESTIGATION CASE FILES & ANALYST DOSSIERS</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Structured maritime case repositories linking anomalous vessel trajectories, rendezvous chains, and behavioral evidence.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-2 rounded bg-accent-blue/30 hover:bg-accent-blue/40 border border-accent-blue text-accent-cyan font-bold text-xs flex items-center space-x-2 transition-all shadow-radar self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation Case</span>
        </button>
      </HudCornerFrame>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-navy-card/90 border border-navy-border rounded-lg glass-panel flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search cases, vessels, analysts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-navy-sidebar border border-navy-border text-white placeholder-text-secondary focus:outline-none focus:border-accent-cyan"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-text-secondary text-[11px] whitespace-nowrap">STATUS:</span>
          {['ALL', 'OPEN_INVESTIGATION', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all whitespace-nowrap border ${
                statusFilter === st 
                  ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan' 
                  : 'bg-navy-sidebar border-navy-border text-text-secondary hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'ALL' : st.replace('_', ' ')}
            </button>
          ))}

          <span className="text-text-secondary text-[11px] ml-2 whitespace-nowrap">PRIORITY:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(pr => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all whitespace-nowrap border ${
                priorityFilter === pr 
                  ? 'bg-risk-alert/20 border-risk-alert text-risk-alert' 
                  : 'bg-navy-sidebar border-navy-border text-text-secondary hover:text-white'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Case Files List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center bg-navy-card/60 border border-navy-border rounded-lg text-text-secondary text-xs">
            No matching investigation case files located for selected criteria.
          </div>
        ) : (
          filteredCases.map((c) => {
            const isExpanded = expandedCaseId === c.id;

            return (
              <div 
                key={c.id}
                className="p-4 bg-navy-sidebar border border-navy-border rounded-lg shadow-panel space-y-3 glass-panel hover:border-accent-cyan/40 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 border-b border-navy-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-accent-cyan">{c.id}</span>
                    <span className="text-sm font-bold text-white">{c.title}</span>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <span>{c.created_at}</span>
                    <span>•</span>
                    <span className="text-accent-cyan">{c.analyst}</span>

                    {/* Status lifecycle selector */}
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="px-2 py-0.5 rounded bg-navy-card border border-navy-border text-white text-[11px] focus:outline-none focus:border-accent-cyan"
                    >
                      <option value="OPEN_INVESTIGATION">Set: OPEN</option>
                      <option value="IN_REVIEW">Set: IN REVIEW</option>
                      <option value="RESOLVED">Set: RESOLVED</option>
                      <option value="ARCHIVED">Set: ARCHIVED</option>
                    </select>

                    {/* Export dropdown / buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => exportCaseJson(c)}
                        className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan flex items-center space-x-1 transition-colors text-[11px]"
                        title="Export case file as JSON dossier"
                      >
                        <FileDown className="w-3 h-3 text-accent-cyan" />
                        <span>JSON</span>
                      </button>

                      <button
                        onClick={() => exportCaseExecutiveBrief(c)}
                        className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-risk-success flex items-center space-x-1 transition-colors text-[11px]"
                        title="Export formatted Executive Brief Markdown dossier"
                      >
                        <Download className="w-3 h-3 text-risk-success" />
                        <span>Brief (.md)</span>
                      </button>

                      <button
                        onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                        className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-accent-cyan flex items-center space-x-1 transition-colors text-[11px]"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Log ({c.log_entries?.length || 1})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attached Vessels Pills */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-text-secondary uppercase">
                    Vessels Under Review ({c.vessels.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.vessels.map(mmsi => {
                      const vObj = vessels.find(v => v.mmsi === mmsi);
                      return (
                        <button
                          key={mmsi}
                          onClick={() => vObj && onSelectVessel(vObj)}
                          className="px-2.5 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-left flex items-center space-x-2 transition-colors group"
                        >
                          <Ship className="w-3.5 h-3.5 text-accent-cyan" />
                          <span className="text-white font-semibold group-hover:text-accent-cyan">
                            {vObj?.vessel_name || mmsi}
                          </span>
                          <span className="text-[10px] text-text-secondary font-mono">
                            [{mmsi}]
                          </span>
                          {vObj && (
                            <span className="text-[10px] text-risk-warning font-bold">
                              {(vObj.composite_risk_score * 100).toFixed(0)}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Initial Case Notes */}
                <div className="p-3 bg-navy-card rounded border border-navy-border text-xs text-text-secondary leading-relaxed">
                  <strong className="text-white">Analyst Notes: </strong>
                  {c.notes}
                </div>

                {/* Expandable Chronological Log & Note Entry */}
                {isExpanded && (
                  <div className="p-3 bg-navy-elevated/70 rounded-lg border border-navy-border space-y-3 pt-3">
                    <div className="text-xs font-bold text-accent-cyan flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>CHRONOLOGICAL OPERATIONAL LOGS</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(c.log_entries || [{ timestamp: c.created_at, author: c.analyst, note: c.notes }]).map((entry, idx) => (
                        <div key={idx} className="p-2 rounded bg-navy-card border border-navy-border text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-text-secondary">
                            <span className="text-accent-cyan font-bold">{entry.author}</span>
                            <span>{entry.timestamp}</span>
                          </div>
                          <p className="text-text-primary text-[11px]">{entry.note}</p>
                        </div>
                      ))}
                    </div>

                    {/* Inline note submission */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-navy-border">
                      <input
                        type="text"
                        placeholder="Append analyst observation note..."
                        value={noteInputs[c.id] || ''}
                        onChange={(e) => setNoteInputs({ ...noteInputs, [c.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNote(c.id);
                          }
                        }}
                        className="flex-1 bg-navy-card border border-navy-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-cyan"
                      />
                      <button
                        onClick={() => handleAddNote(c.id)}
                        className="px-3 py-1.5 rounded bg-accent-blue/30 hover:bg-accent-blue/40 border border-accent-blue text-accent-cyan font-bold text-xs flex items-center space-x-1.5 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Log</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Case Creation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-elevated border border-navy-border rounded-lg shadow-2xl w-full max-w-lg p-5 font-mono text-xs text-text-primary space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="text-sm font-bold text-accent-cyan flex items-center space-x-2">
                <FolderLock className="w-4 h-4" />
                <span>CREATE INVESTIGATION CASE DOSSIER</span>
              </span>
              <button 
                onClick={() => { setShowNewModal(false); if (onClearVesselForCase) onClearVesselForCase(); }}
                className="text-text-secondary hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="text-text-secondary text-[11px] block mb-1">CASE TITLE:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Laconic Gulf Suspicious STS Chain"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-navy-card border border-navy-border rounded p-2 text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div>
                <label className="text-text-secondary text-[11px] block mb-1">PRIORITY TIER:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-navy-card border border-navy-border rounded p-2 text-white focus:outline-none focus:border-accent-cyan"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                  <option value="HIGH">HIGH (Priority Investigation)</option>
                  <option value="MEDIUM">MEDIUM (Standard Review)</option>
                  <option value="LOW">LOW (Informational Archival)</option>
                </select>
              </div>

              <div>
                <label className="text-text-secondary text-[11px] block mb-1">ATTACH TARGET VESSELS:</label>
                <div className="max-h-32 overflow-y-auto bg-navy-card border border-navy-border rounded p-2 space-y-1">
                  {vessels.map(v => (
                    <label key={v.mmsi} className="flex items-center space-x-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedMmsis.includes(v.mmsi)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMmsis([...selectedMmsis, v.mmsi]);
                          else setSelectedMmsis(selectedMmsis.filter(m => m !== v.mmsi));
                        }}
                        className="rounded bg-navy-elevated border-navy-border text-accent-cyan"
                      />
                      <span>{v.vessel_name} [{v.mmsi}] - {v.flag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-text-secondary text-[11px] block mb-1">INITIAL ANALYST ASSESSMENT & EVIDENCE:</label>
                <textarea
                  rows="3"
                  placeholder="Summarize AIS transmission gaps, draught variance, bilateral encounter timestamps, and recommended follow-up actions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-navy-card border border-navy-border rounded p-2 text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-navy-border">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); if (onClearVesselForCase) onClearVesselForCase(); }}
                  className="px-3 py-1.5 rounded bg-navy-card hover:bg-navy-border text-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-accent-blue/30 hover:bg-accent-blue/40 border border-accent-blue text-accent-cyan font-bold"
                >
                  Open Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

