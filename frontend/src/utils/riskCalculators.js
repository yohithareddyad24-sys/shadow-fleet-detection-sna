/**
 * Risk Scoring Engine Formulas & Normalizers.
 * Matches Member 3's Composite Network Risk formula:
 * Score = w_deg * C_deg + w_bet * C_bet + w_flag * I_flag + w_gap * norm_gaps + w_spf * norm_spoofs
 */

export const DEFAULT_WEIGHTS = {
  weight_degree: 0.20,
  weight_betweenness: 0.30,
  weight_flag: 0.25,
  weight_ais_gaps: 0.15,
  weight_spoofing: 0.10,
};

export function categorizeRiskTier(score) {
  const num = Number(score);
  if (num >= 0.65) return 'CRITICAL_MONITORING';
  if (num >= 0.45) return 'ELEVATED_ATTENTION';
  if (num >= 0.25) return 'MODERATE_INTERACTION';
  return 'BASELINE_LEGITIMATE';
}

export function computeCompositeRisk(vessel, maxGaps = 15, maxSpoofs = 6, weights = DEFAULT_WEIGHTS) {
  const cDeg = Math.min(Math.max(vessel.degree_centrality || 0, 0), 1);
  const cBet = Math.min(Math.max(vessel.betweenness_centrality || 0, 0), 1);
  const iFlag = Math.min(Math.max(vessel.flag_risk_weight || 0, 0), 1);
  const normGaps = maxGaps > 0 ? (vessel.ais_gap_count || 0) / maxGaps : 0;
  const normSpoofs = maxSpoofs > 0 ? (vessel.spoofing_incident_count || 0) / maxSpoofs : 0;

  const contribDegree = cDeg * weights.weight_degree;
  const contribBetweenness = cBet * weights.weight_betweenness;
  const contribFlag = iFlag * weights.weight_flag;
  const contribGaps = normGaps * weights.weight_ais_gaps;
  const contribSpoofing = normSpoofs * weights.weight_spoofing;

  const totalScore = Math.min(
    Math.max(
      contribDegree + contribBetweenness + contribFlag + contribGaps + contribSpoofing,
      0
    ),
    1
  );

  return {
    score: Number(totalScore.toFixed(4)),
    tier: categorizeRiskTier(totalScore),
    contributions: {
      degree: Number(contribDegree.toFixed(4)),
      betweenness: Number(contribBetweenness.toFixed(4)),
      flag: Number(contribFlag.toFixed(4)),
      ais_gaps: Number(contribGaps.toFixed(4)),
      spoofing: Number(contribSpoofing.toFixed(4)),
    }
  };
}
