/**
 * DEMO DATA ADAPTER: Bilateral Encounters & Rendezvous Events
 */

export const DEMO_ENCOUNTERS = [
  { source_mmsi: "999000001", source_name: "MOCK_NEPTUNE_FEEDER", target_mmsi: "999000002", target_name: "MOCK_OCEAN_SHADOW", interaction_type: "STS_TRANSFER", interaction_count: 5, avg_duration_hours: 18.5, interaction_risk: 0.85, avg_distance_nm: 0.05, isDemo: true },
  { source_mmsi: "999000001", source_name: "MOCK_NEPTUNE_FEEDER", target_mmsi: "999000005", target_name: "MOCK_BALTIC_RUNNER", interaction_type: "PROXIMITY_EVENT", interaction_count: 3, avg_duration_hours: 8.0, interaction_risk: 0.65, avg_distance_nm: 0.20, isDemo: true },
  { source_mmsi: "999000001", source_name: "MOCK_NEPTUNE_FEEDER", target_mmsi: "999000009", target_name: "MOCK_SEAFARER_TUG", interaction_type: "TUG_SUPPORT", interaction_count: 4, avg_duration_hours: 6.0, interaction_risk: 0.50, avg_distance_nm: 0.10, isDemo: true },
  { source_mmsi: "999000002", source_name: "MOCK_OCEAN_SHADOW", target_mmsi: "999000004", target_name: "MOCK_AEGEAN_BRIDGE", interaction_type: "STS_TRANSFER", interaction_count: 4, avg_duration_hours: 14.0, interaction_risk: 0.75, avg_distance_nm: 0.04, isDemo: true },
  { source_mmsi: "999000004", source_name: "MOCK_AEGEAN_BRIDGE", target_mmsi: "999000006", target_name: "MOCK_PACIFIC_STAR", interaction_type: "STS_TRANSFER", interaction_count: 6, avg_duration_hours: 22.0, interaction_risk: 0.90, avg_distance_nm: 0.03, isDemo: true },
  { source_mmsi: "999000005", source_name: "MOCK_BALTIC_RUNNER", target_mmsi: "999000008", target_name: "MOCK_ATLANTIC_PEARL", interaction_type: "PROXIMITY_EVENT", interaction_count: 3, avg_duration_hours: 7.5, interaction_risk: 0.70, avg_distance_nm: 0.15, isDemo: true },
  { source_mmsi: "999000006", source_name: "MOCK_PACIFIC_STAR", target_mmsi: "999000008", target_name: "MOCK_ATLANTIC_PEARL", interaction_type: "STS_TRANSFER", interaction_count: 3, avg_duration_hours: 16.0, interaction_risk: 0.80, avg_distance_nm: 0.06, isDemo: true },
  { source_mmsi: "999000004", source_name: "MOCK_AEGEAN_BRIDGE", target_mmsi: "999000010", target_name: "MOCK_HORIZON_DEST", interaction_type: "STS_TRANSFER", interaction_count: 2, avg_duration_hours: 10.0, interaction_risk: 0.55, avg_distance_nm: 0.08, isDemo: true },
  { source_mmsi: "999000008", source_name: "MOCK_ATLANTIC_PEARL", target_mmsi: "999000010", target_name: "MOCK_HORIZON_DEST", interaction_type: "STS_TRANSFER", interaction_count: 3, avg_duration_hours: 12.5, interaction_risk: 0.60, avg_distance_nm: 0.07, isDemo: true },
  { source_mmsi: "999000003", source_name: "MOCK_TITAN_CARRIER", target_mmsi: "999000007", target_name: "MOCK_NORTHERN_LIGHT", interaction_type: "PORT_PROXIMITY", interaction_count: 2, avg_duration_hours: 3.0, interaction_risk: 0.15, avg_distance_nm: 0.80, isDemo: true },
  { source_mmsi: "999000007", source_name: "MOCK_NORTHERN_LIGHT", target_mmsi: "999000010", target_name: "MOCK_HORIZON_DEST", interaction_type: "BUNKERING", interaction_count: 3, avg_duration_hours: 4.5, interaction_risk: 0.25, avg_distance_nm: 0.12, isDemo: true },
  { source_mmsi: "999000011", source_name: "MOCK_ISOLATED_ALPHA", target_mmsi: "999000012", target_name: "MOCK_ISOLATED_BETA", interaction_type: "PROXIMITY_EVENT", interaction_count: 1, avg_duration_hours: 2.0, interaction_risk: 0.20, avg_distance_nm: 0.30, isDemo: true },
];
