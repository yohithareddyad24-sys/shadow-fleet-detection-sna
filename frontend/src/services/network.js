/**
 * Network & ACO Pathfinding Service Module.
 * Connects to /api/network/graph and /api/optimizer/aco-path with demo fallback.
 */

import { apiClient } from './api';
import { DEMO_VESSELS } from './demo/demoVessels';
import { DEMO_ENCOUNTERS } from './demo/demoEncounters';

export async function getNetworkGraph(signal) {
  try {
    const res = await apiClient('/api/network/graph', { signal });
    if (res.data && res.data.elements) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/network/graph unreachable. Using demo network adapter.", err.message);
  }

  // Construct Cytoscape graph from demo data
  const elements = [];
  DEMO_VESSELS.forEach(v => {
    elements.push({
      data: {
        id: v.mmsi,
        label: v.vessel_name.replace("MOCK_", ""),
        fullName: v.vessel_name,
        flag: v.flag,
        riskScore: v.composite_risk_score,
        riskTier: v.risk_tier,
        betweenness: v.betweenness_centrality,
        degree: v.degree_centrality,
        isDemo: true,
      }
    });
  });

  DEMO_ENCOUNTERS.forEach((e, i) => {
    elements.push({
      data: {
        id: `edge-${i}`,
        source: e.source_mmsi,
        target: e.target_mmsi,
        interactionType: e.interaction_type,
        count: e.interaction_count,
        duration: e.avg_duration_hours,
        risk: e.interaction_risk,
        distance: e.avg_distance_nm,
        isDemo: true,
      }
    });
  });

  const demoGraph = {
    summary: {
      num_nodes: DEMO_VESSELS.length,
      num_edges: DEMO_ENCOUNTERS.length,
      density: 0.1818,
      is_connected: false,
      num_connected_components: 2,
      average_degree: 2.0,
      is_directed: false,
    },
    components: [
      { component_id: 1, size: 10, density: 0.2444, vessels: ["999000001", "999000002", "999000003", "999000004", "999000005", "999000006", "999000007", "999000008", "999000009", "999000010"] },
      { component_id: 2, size: 2, density: 1.0, vessels: ["999000011", "999000012"] },
    ],
    elements,
  };

  return { data: demoGraph, isDemo: true };
}

export async function runAcoPathfinder(params, signal) {
  try {
    const res = await apiClient('/api/optimizer/aco-path', {
      method: 'POST',
      body: params,
      timeout: 8000,
      signal,
    });
    if (res.data) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/optimizer/aco-path unreachable. Using demo ACO simulation.", err.message);
  }

  // Fallback optimal path simulation
  const path = ["999000001", "999000002", "999000004", "999000006", "999000008", "999000010"];
  const hopsWithCoords = path.map(mmsi => {
    const v = DEMO_VESSELS.find(item => item.mmsi === mmsi);
    return {
      mmsi,
      vessel_name: v ? v.vessel_name : mmsi,
      lat: v ? v.lat : 35.0,
      lng: v ? v.lng : 20.0,
      port: v ? v.port : "Sea",
    };
  });

  const demoResult = {
    source: params.source || "999000001",
    destination: params.destination || "999000010",
    best_path: path,
    best_path_vessel_names: path.map(m => DEMO_VESSELS.find(v => v.mmsi === m)?.vessel_name || m),
    path_fitness: 1.7441,
    total_hops: 5,
    cumulative_risk: 3.9000,
    iterations_run: params.num_iterations || 25,
    found_valid_path: true,
    disclaimer: "ACO is an exploratory path search heuristic. Discovered paths do NOT constitute proof of illicit activity or shadow fleet membership.",
    hops_with_coords: hopsWithCoords,
    convergence_history: [0.85, 1.15, 1.34, 1.52, 1.68, 1.7441, 1.7441, 1.7441, 1.7441, 1.7441],
    isDemo: true,
  };

  return { data: demoResult, isDemo: true };
}
