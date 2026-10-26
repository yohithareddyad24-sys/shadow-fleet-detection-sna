/**
 * Alerts & Case Management Service Module.
 * Connects to /api/alerts and /api/investigations with demo fallback adapter.
 */

import { apiClient } from './api';
import { DEMO_ALERTS } from './demo/demoAlerts';

export async function getAlerts(signal) {
  try {
    const res = await apiClient('/api/alerts', { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/alerts unreachable. Using demo alerts adapter.", err.message);
  }

  return { data: DEMO_ALERTS, isDemo: true };
}

const LOCAL_STORAGE_CASES_KEY = 'shadow_fleet_cases_v1';

const DEFAULT_DEMO_CASES = [
  {
    id: "CASE-2026-0891",
    title: "Laconic Gulf Multi-Tier STS Rendezvous Chain",
    created_at: "2026-10-25 14:30 UTC",
    status: "OPEN_INVESTIGATION",
    priority: "HIGH",
    analyst: "Operational Desk 03",
    vessels: ["999000001", "999000002", "999000004", "999000006"],
    notes: "Observed 18.5h proximity event between MOCK_NEPTUNE_FEEDER and MOCK_OCEAN_SHADOW with draught variance. Follow-up transfer chain identified leading towards Malta Hurd Bank.",
    log_entries: [
      { timestamp: "2026-10-25 14:30 UTC", author: "Operational Desk 03", note: "Case opened after algorithmic STS trigger." },
      { timestamp: "2026-10-25 18:45 UTC", author: "Analyst Reynolds", note: "Draught differential verified against AIS payload estimation." }
    ],
    isDemo: true,
  },
  {
    id: "CASE-2026-0892",
    title: "Skagerrak Dark AIS Gap & Speed Anomaly",
    created_at: "2026-10-26 09:15 UTC",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    analyst: "Operational Desk 01",
    vessels: ["999000005"],
    notes: "15 consecutive AIS transmission gaps totaling 72 hours unmonitored passage. Transponder reactivated with modified declared destination.",
    log_entries: [
      { timestamp: "2026-10-26 09:15 UTC", author: "Operational Desk 01", note: "Dark corridor transition flagged along North Sea corridor." }
    ],
    isDemo: true,
  }
];

function getStoredCases() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CASES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveStoredCases(cases) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CASES_KEY, JSON.stringify(cases));
  } catch (_) {}
}

export async function getInvestigationCases(signal) {
  try {
    const res = await apiClient('/api/investigations', { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/investigations unreachable. Using local case cache.", err.message);
  }

  const cached = getStoredCases();
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return { data: cached, isDemo: true };
  }

  saveStoredCases(DEFAULT_DEMO_CASES);
  return { data: DEFAULT_DEMO_CASES, isDemo: true };
}

export async function createInvestigationCase(caseData, signal) {
  try {
    const res = await apiClient('/api/investigations', {
      method: 'POST',
      body: caseData,
      signal,
    });
    if (res.data) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/investigations unreachable. Simulating local case creation.", err.message);
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const localCase = {
    id: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    ...caseData,
    created_at: now,
    status: caseData.status || 'OPEN_INVESTIGATION',
    analyst: caseData.analyst || 'Operational Desk 01',
    log_entries: [
      { timestamp: now, author: caseData.analyst || 'Operational Desk 01', note: caseData.notes || 'Case created.' }
    ],
    isDemo: true,
  };

  const current = getStoredCases() || DEFAULT_DEMO_CASES;
  const updated = [localCase, ...current.filter(c => c.id !== localCase.id)];
  saveStoredCases(updated);

  return { data: localCase, isDemo: true };
}

export async function updateInvestigationCase(caseId, updates) {
  const current = getStoredCases() || DEFAULT_DEMO_CASES;
  const updated = current.map(c => {
    if (c.id === caseId) {
      return { ...c, ...updates };
    }
    return c;
  });
  saveStoredCases(updated);
  return { data: updated.find(c => c.id === caseId), isDemo: true };
}

export async function addCaseNote(caseId, noteText, author = 'Analyst Desk') {
  const current = getStoredCases() || DEFAULT_DEMO_CASES;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const newEntry = { timestamp: now, author, note: noteText };

  const updated = current.map(c => {
    if (c.id === caseId) {
      const logs = Array.isArray(c.log_entries) ? [...c.log_entries, newEntry] : [newEntry];
      return { ...c, log_entries: logs, notes: `${c.notes}\n[${now}] ${noteText}` };
    }
    return c;
  });
  saveStoredCases(updated);
  return { data: updated.find(c => c.id === caseId), isDemo: true };
}

