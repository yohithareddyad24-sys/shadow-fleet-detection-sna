/**
 * Vessel Service Module.
 * Connects to /api/vessels and /api/vessels/{mmsi} with fallback to demoVessels adapter.
 */

import { apiClient } from './api';
import { DEMO_VESSELS } from './demo/demoVessels';

/**
 * Normalizes vessel fields ensuring null-safe access throughout components.
 */
export function normalizeVessel(raw = {}) {
  const mmsi = String(raw.mmsi || 'UNKNOWN');
  return {
    mmsi,
    vessel_name: raw.vessel_name || `VESSEL_${mmsi}`,
    flag: raw.flag || 'Unknown Flag',
    vessel_type: raw.vessel_type || 'Cargo/Tanker',
    flag_risk_weight: Number(raw.flag_risk_weight ?? 0.0),
    ais_gap_count: Number(raw.ais_gap_count ?? 0),
    spoofing_incident_count: Number(raw.spoofing_incident_count ?? 0),
    degree_centrality: Number(raw.degree_centrality ?? 0.0),
    betweenness_centrality: Number(raw.betweenness_centrality ?? 0.0),
    composite_risk_score: Number(raw.composite_risk_score ?? 0.0),
    risk_tier: raw.risk_tier || 'BASELINE_LEGITIMATE',
    primary_risk_driver: raw.primary_risk_driver || 'Baseline',
    lat: Number(raw.lat ?? 30.0),
    lng: Number(raw.lng ?? 20.0),
    port: raw.port || 'International Waters',
    heading: Number(raw.heading ?? 0),
    speed: Number(raw.speed ?? 0),
    status: raw.status || 'UNDERWAY',
    imo: raw.imo || `9${mmsi.slice(-6)}`,
    dwt: Number(raw.dwt ?? 85000),
    year_built: Number(raw.year_built ?? 2005),
    registered_owner: raw.registered_owner || 'Undisclosed Registered Owner',
    commercial_operator: raw.commercial_operator || 'Global Ocean Management',
    beneficial_owner: raw.beneficial_owner || 'Private Shipping Entity',
    draught_m: Number(raw.draught_m ?? 12.0),
    destination: raw.destination || 'HIGH SEAS',
    eta: raw.eta || 'NOT REPORTED',
    contrib_degree: Number(raw.contrib_degree ?? 0.0),
    contrib_betweenness: Number(raw.contrib_betweenness ?? 0.0),
    contrib_flag: Number(raw.contrib_flag ?? 0.0),
    contrib_ais_gaps: Number(raw.contrib_ais_gaps ?? 0.0),
    contrib_spoofing: Number(raw.contrib_spoofing ?? 0.0),
    isDemo: Boolean(raw.isDemo),
    neighbors: Array.isArray(raw.neighbors) ? raw.neighbors : [],
    trajectory: Array.isArray(raw.trajectory) ? raw.trajectory : [],
    ais_gaps: Array.isArray(raw.ais_gaps) ? raw.ais_gaps : [],
  };
}

/**
 * Fetch all monitored vessels with search, filter, and pagination support.
 */
export async function getVessels(params = {}, signal) {
  try {
    const res = await apiClient('/api/vessels', { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      const normalized = res.data.map(normalizeVessel);
      return applyFiltersAndPagination(normalized, params, false);
    }
  } catch (err) {
    console.warn("Backend /api/vessels unreachable. Using demo adapter.", err.message);
  }

  // Graceful fallback to demo adapter
  const normalizedDemo = DEMO_VESSELS.map(normalizeVessel);
  return applyFiltersAndPagination(normalizedDemo, params, true);
}

/**
 * Fetch a single vessel's intelligence dossier.
 */
export async function getVesselByMmsi(mmsi, signal) {
  try {
    const res = await apiClient(`/api/vessels/${mmsi}`, { signal });
    if (res.data) {
      return { data: normalizeVessel(res.data), isDemo: false };
    }
  } catch (err) {
    console.warn(`Backend /api/vessels/${mmsi} unreachable. Using demo adapter.`, err.message);
  }

  // Fallback to demo vessel
  const demoFound = DEMO_VESSELS.find(v => v.mmsi === String(mmsi)) || DEMO_VESSELS[0];
  return { data: normalizeVessel(demoFound), isDemo: true };
}

function applyFiltersAndPagination(vessels, params = {}, isDemo = false) {
  let list = [...vessels];

  if (params.search) {
    const s = params.search.toLowerCase().trim();
    list = list.filter(v =>
      v.vessel_name.toLowerCase().includes(s) ||
      v.mmsi.includes(s) ||
      v.imo.includes(s) ||
      v.flag.toLowerCase().includes(s)
    );
  }

  if (params.tier && params.tier !== 'ALL') {
    list = list.filter(v => v.risk_tier === params.tier);
  }

  if (params.flag && params.flag !== 'ALL') {
    list = list.filter(v => v.flag === params.flag);
  }

  if (params.type && params.type !== 'ALL') {
    list = list.filter(v => v.vessel_type === params.type);
  }

  if (params.sortBy) {
    const field = params.sortBy;
    const asc = params.sortAsc ?? false;
    list.sort((a, b) => {
      let valA = a[field] ?? '';
      let valB = b[field] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  }

  const total = list.length;
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = Number(params.pageSize || 50);
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    isDemo,
  };
}
