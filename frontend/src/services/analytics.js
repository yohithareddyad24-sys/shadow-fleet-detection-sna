/**
 * Analytics Service Module.
 * Connects to /api/metrics/summary with fallback to demo calculations.
 */

import { apiClient } from './api';
import { DEMO_VESSELS } from './demo/demoVessels';
import { DEMO_ENCOUNTERS } from './demo/demoEncounters';

export async function getFleetMetrics(signal) {
  try {
    const res = await apiClient('/api/metrics/summary', { signal });
    if (res.data) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/metrics/summary unreachable. Using demo analytics.", err.message);
  }

  // Fallback demo summary
  const tierCounts = {
    CRITICAL_MONITORING: 0,
    ELEVATED_ATTENTION: 0,
    MODERATE_INTERACTION: 0,
    BASELINE_LEGITIMATE: 0,
  };

  const flagCounts = {};
  let totalGaps = 0;
  let totalSpoofs = 0;

  DEMO_VESSELS.forEach(v => {
    tierCounts[v.risk_tier] = (tierCounts[v.risk_tier] || 0) + 1;
    flagCounts[v.flag] = (flagCounts[v.flag] || 0) + 1;
    totalGaps += v.ais_gap_count || 0;
    totalSpoofs += v.spoofing_incident_count || 0;
  });

  const demoData = {
    total_vessels: DEMO_VESSELS.length,
    total_interactions: DEMO_ENCOUNTERS.length,
    critical_count: tierCounts.CRITICAL_MONITORING,
    elevated_count: tierCounts.ELEVATED_ATTENTION,
    moderate_count: tierCounts.MODERATE_INTERACTION,
    baseline_count: tierCounts.BASELINE_LEGITIMATE,
    total_dark_gaps_reported: totalGaps,
    total_spoofing_incidents: totalSpoofs,
    tier_distribution: [
      { tier: "CRITICAL", count: tierCounts.CRITICAL_MONITORING, color: "#FF5C65" },
      { tier: "ELEVATED", count: tierCounts.ELEVATED_ATTENTION, color: "#F5B942" },
      { tier: "MODERATE", count: tierCounts.MODERATE_INTERACTION, color: "#4285F4" },
      { tier: "BASELINE", count: tierCounts.BASELINE_LEGITIMATE, color: "#39D98A" },
    ],
    flag_distribution: Object.entries(flagCounts).map(([flag, count]) => ({ flag, count })),
    top_risk_vessels: [...DEMO_VESSELS].sort((a, b) => b.composite_risk_score - a.composite_risk_score).slice(0, 5),
  };

  return { data: demoData, isDemo: true };
}
