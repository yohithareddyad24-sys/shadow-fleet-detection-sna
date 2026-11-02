/**
 * Network & ACO Pathfinding Service Module.
 * Connects to /api/network/graph and /api/optimizer/aco-path with enriched fallback adapter.
 * Provides:
 * - Multigraph (parallel interaction edges) & Simple Graph representations
 * - Evidence-backed edges (documented ownership, STS encounters, repeated interactions, shared registry, unverified proximity)
 * - Indicator evidence separated into Observed facts / Algorithmic inferences / Unverified
 * - Dynamic event generation and event history tracking
 */

import { apiClient } from './api';
import { DEMO_VESSELS } from './demo/demoVessels';
import { DEMO_ENCOUNTERS } from './demo/demoEncounters';

// Multigraph parallel encounters
export const DEMO_MULTIGRAPH_EDGES = [
  {
    id: "edge-sts-1a",
    source: "999000001",
    target: "999000002",
    interactionType: "STS_ENCOUNTER",
    label: "STS Rendezvous #1",
    count: 1,
    duration: 18.5,
    risk: 0.82,
    distance: 0.08,
    isVerified: true,
    evidence: "Recorded 18.5h zero-speed proximity in Laconic Gulf anchorage with +2.8m draught differential.",
    timestamps: { firstSeen: "2026-10-24 12:00 UTC", lastSeen: "2026-10-25 06:30 UTC" },
    sourceInfo: "Satellite AIS + Terrestrial Chokepoint Receiver",
    curveOffset: 25,
  },
  {
    id: "edge-sts-1b",
    source: "999000001",
    target: "999000002",
    interactionType: "REPEATED_INTERACTION",
    label: "STS Rendezvous #2",
    count: 2,
    duration: 12.0,
    risk: 0.78,
    distance: 0.12,
    isVerified: true,
    evidence: "Second rendezvous documented 14 days prior off Cape Matapan; coordinated speed drop to 0.6 kn.",
    timestamps: { firstSeen: "2026-10-10 04:15 UTC", lastSeen: "2026-10-10 16:15 UTC" },
    sourceInfo: "Satellite AIS Ingestion Pipeline",
    curveOffset: -25,
  },
  {
    id: "edge-corp-1",
    source: "999000001",
    target: "999000004",
    interactionType: "DOCUMENTED_OWNERSHIP",
    label: "Shared Technical Manager",
    count: 1,
    duration: 0,
    risk: 0.65,
    distance: 0,
    isVerified: true,
    evidence: "Both vessels contracted under Pontus Ocean Shipmanagement SPV per public maritime filings.",
    timestamps: { firstSeen: "2024-03-15 UTC", lastSeen: "2026-10-26 UTC" },
    sourceInfo: "International Maritime Registry Entity Filings",
    curveOffset: 0,
  },
  {
    id: "edge-sts-2",
    source: "999000004",
    target: "999000006",
    interactionType: "STS_ENCOUNTER",
    label: "Offshore STS Offload",
    count: 3,
    duration: 22.0,
    risk: 0.88,
    distance: 0.05,
    isVerified: true,
    evidence: "22.0h bilateral zero-speed encounter in international waters east of Malta Hurd Bank.",
    timestamps: { firstSeen: "2026-10-26 17:30 UTC", lastSeen: "2026-10-27 15:30 UTC" },
    sourceInfo: "Satellite SAR & AIS Ingestion Pipeline",
    curveOffset: 15,
  },
  {
    id: "edge-corp-2",
    source: "999000002",
    target: "999000009",
    interactionType: "SHARED_REGISTRY_ENTITY",
    label: "Common Beneficial SPV",
    count: 1,
    duration: 0,
    risk: 0.58,
    distance: 0,
    isVerified: true,
    evidence: "Commercial operator registered to identical Istanbul maritime address with linked ownership shares.",
    timestamps: { firstSeen: "2025-01-10 UTC", lastSeen: "2026-10-26 UTC" },
    sourceInfo: "Commercial Maritime Registry Database",
    curveOffset: 0,
  },
  {
    id: "edge-escort",
    source: "999000001",
    target: "999000009",
    interactionType: "REPEATED_INTERACTION",
    label: "Support Transit Escort",
    count: 4,
    duration: 36.0,
    risk: 0.62,
    distance: 0.45,
    isVerified: true,
    evidence: "Support tug maintained 0.4 nm convoy pattern through Kythira Strait during dark AIS transition.",
    timestamps: { firstSeen: "2026-10-24 18:00 UTC", lastSeen: "2026-10-25 14:00 UTC" },
    sourceInfo: "Coastal Station Telemetry & AIS Stream",
    curveOffset: 20,
  },
  {
    id: "edge-unverified-1",
    source: "999000005",
    target: "999000008",
    interactionType: "UNVERIFIED_PROXIMITY",
    label: "Unverified Proximity",
    count: 1,
    duration: 4.2,
    risk: 0.45,
    distance: 0.85,
    isVerified: false,
    evidence: "Transient passing event in English Channel approaches; no documented zero-speed interaction or transfer hose deployment.",
    timestamps: { firstSeen: "2026-10-21 08:30 UTC", lastSeen: "2026-10-21 12:45 UTC" },
    sourceInfo: "Coastal AIS Receiver (Unconfirmed Radar Echo)",
    curveOffset: 0,
  },
  {
    id: "edge-unverified-2",
    source: "999000006",
    target: "999000008",
    interactionType: "UNVERIFIED_PROXIMITY",
    label: "Unverified Loitering",
    count: 1,
    duration: 6.0,
    risk: 0.42,
    distance: 1.10,
    isVerified: false,
    evidence: "Concurrent anchorage in Gibraltar eastern roadstead; separation distance exceeded standard STS safety envelope (>1.0 nm).",
    timestamps: { firstSeen: "2026-10-23 02:00 UTC", lastSeen: "2026-10-23 08:00 UTC" },
    sourceInfo: "Port Authority Movement Log",
    curveOffset: 0,
  },
  {
    id: "edge-bridge-1",
    source: "999000008",
    target: "999000010",
    interactionType: "STS_ENCOUNTER",
    label: "Algeciras Gateway Handoff",
    count: 2,
    duration: 14.0,
    risk: 0.72,
    distance: 0.15,
    isVerified: true,
    evidence: "Recorded 14.0h bilateral encounter with speed 0.8 kn in international waters outside Strait of Gibraltar.",
    timestamps: { firstSeen: "2026-10-25 09:00 UTC", lastSeen: "2026-10-25 23:00 UTC" },
    sourceInfo: "Satellite AIS Rendezvous Heuristics",
    curveOffset: -18,
  },
  {
    id: "edge-bridge-2",
    source: "999000006",
    target: "999000010",
    interactionType: "REPEATED_INTERACTION",
    label: "Feeder Relay Encounter",
    count: 2,
    duration: 16.5,
    risk: 0.76,
    distance: 0.10,
    isVerified: true,
    evidence: "Bilateral zero-speed encounter off Malta prior to onward passage toward Atlantic basin.",
    timestamps: { firstSeen: "2026-10-18 14:00 UTC", lastSeen: "2026-10-19 06:30 UTC" },
    sourceInfo: "Satellite AIS Telemetry Pipeline",
    curveOffset: 18,
  },
  {
    id: "edge-isolated",
    source: "999000011",
    target: "999000012",
    interactionType: "STS_ENCOUNTER",
    label: "Pacific Roadstead Rendezvous",
    count: 1,
    duration: 8.0,
    risk: 0.60,
    distance: 0.20,
    isVerified: true,
    evidence: "8.0h encounter in Port Vila offshore anchorage; secondary cluster.",
    timestamps: { firstSeen: "2026-10-15 10:00 UTC", lastSeen: "2026-10-15 18:00 UTC" },
    sourceInfo: "Regional Fisheries Surveillance Log",
    curveOffset: 0,
  }
];

// Rich indicator evidence per vessel
export const VESSEL_INDICATOR_EVIDENCE = {
  "999000001": {
    observedFacts: [
      { type: "AIS Transmission Gap", measurement: "12.5 hours unmonitored", location: "Laconic Gulf (36.42°N, 22.85°E)", timestamp: "2026-10-24 22:15 UTC", source: "Coastal Chokepoint Receiver" },
      { type: "Draught Differential", measurement: "+2.8m post-gap increase (12.0m to 14.8m)", location: "Laconic Gulf STS Area", timestamp: "2026-10-25 10:45 UTC", source: "AIS Static & Voyage Broadcast" },
      { type: "Speed Slowdown", measurement: "Dropped from 12.4 kn to 0.8 kn", location: "Cape Matapan Approaches", timestamp: "2026-10-25 04:00 UTC", source: "Kinematic Broadcast Stream" },
    ],
    algorithmicInferences: [
      { type: "High Network Betweenness", measurement: "C_B = 0.3541 (Highest bridge role in Cluster 1)", location: "SNA Topology Engine", timestamp: "2026-10-26 18:00 UTC", source: "NetworkX SNA Engine" },
      { type: "Bilateral STS Rendezvous", measurement: "Proximity 0.08 nm for 18.5 hours with 999000002", location: "Laconic Gulf Hotspot", timestamp: "2026-10-25 06:30 UTC", source: "Automated Encounter Algorithm" },
    ],
    unverified: [
      { type: "Third-party Flag Advisory", measurement: "Unconfirmed registry notice regarding Comoros reflagging", location: "Piraeus Port State Control", timestamp: "2026-10-22 UTC", source: "Open Intelligence Bulletin" },
    ],
    alternativeExplanations: "Observed gap occurred during reported severe sea state Force 7 in Kythira Strait; potential terrestrial receiver antenna masking behind Taygetus mountain ridge; engine speed reduction may correlate with emergency bunkering operations.",
  },
  "999000002": {
    observedFacts: [
      { type: "Stationary Loitering", measurement: "18.5 hours at 0.6 kn speed", location: "Laconic Gulf STS Area", timestamp: "2026-10-25 06:30 UTC", source: "Coastal Station Telemetry" },
      { type: "Flag Registry Alteration", measurement: "Changed from Panama to Gabon registry", location: "International Maritime Organization", timestamp: "2026-06-12 UTC", source: "Commercial Vessel Register" },
    ],
    algorithmicInferences: [
      { type: "SNA Cluster Hub", measurement: "Degree centrality C_D = 0.4000 (4 active interaction ties)", location: "Network Topology Engine", timestamp: "2026-10-26 18:00 UTC", source: "Member 3 SNA Module" },
    ],
    unverified: [
      { type: "Unconfirmed Cargo Declaration", measurement: "Crude oil blend origin declared as non-sanctioned transit", location: "Terminal Manifest", timestamp: "2026-10-20 UTC", source: "Commercial Agent Notice" },
    ],
    alternativeExplanations: "Vessel was holding in recognized international anchorage awaiting charter orders; STS equipment was deployed in designated sheltered waters permissible under coastal state oversight.",
  },
  "999000005": {
    observedFacts: [
      { type: "Repeated Dark AIS Gaps", measurement: "15 separate gaps totaling 72 hours", location: "Skagerrak Transit Passage", timestamp: "2026-10-26 09:15 UTC", source: "North Sea AIS Stream" },
      { type: "Kinematic Speed Discrepancy", measurement: "28 kn calculated speed vs 11 kn broadcast capability", location: "Skagerrak Approaches (57.72°N, 11.96°E)", timestamp: "2026-10-26 11:20 UTC", source: "GPS/AIS Velocity Verification" },
    ],
    algorithmicInferences: [
      { type: "Kinematic Spoofing Anomaly", measurement: "Discontinuous coordinate leap (+18 nm in 20 min)", location: "Skagerrak Corridor", timestamp: "2026-10-26 11:20 UTC", source: "Heuristic Anomaly Model" },
    ],
    unverified: [
      { type: "GPS Jamming Interference", measurement: "Regional GNSS spoofing reported in eastern Skagerrak", location: "Regional Hydrographic Office", timestamp: "2026-10-26 UTC", source: "Navigational Warning Navarea I" },
    ],
    alternativeExplanations: "Well-documented electronic warfare and GNSS spoofing active in northern waters causing false positioning leaps; transponder hardware intermittent power failure documented in port inspection report.",
  },
  "999000006": {
    observedFacts: [
      { type: "Offshore STS Encounter", measurement: "22.0 hours zero-speed proximity with 999000004", location: "Malta Hurd Bank (35.95°N, 14.62°E)", timestamp: "2026-10-26 17:30 UTC", source: "Satellite SAR & AIS Ingestion" },
      { type: "Draught Increase", measurement: "+1.9m draught increase following offshore rendezvous", location: "Malta Offshore Anchorage", timestamp: "2026-10-27 15:30 UTC", source: "AIS Voyage Message" },
    ],
    algorithmicInferences: [
      { type: "Multi-Hop Pathway Intermediary", measurement: "High bridge centrality connecting Mediterranean to Atlantic corridor", location: "ACO Workbench", timestamp: "2026-10-26 18:00 UTC", source: "ACO Graph Pathfinder" },
    ],
    unverified: [
      { type: "Ownership Chain Opacity", measurement: "SPV registered in Marshall Islands with undisclosed beneficial holder", location: "Corporate Registry", timestamp: "2026-08-01 UTC", source: "Open Source Intelligence" },
    ],
    alternativeExplanations: "Legitimate offshore bunkering transfer in established Hurd Bank anchorage; draught change consistent with heavy fuel oil refueling and ballast adjustment.",
  }
};

/**
 * Fetch Network Graph with support for Multigraph / Simple Graph.
 */
export async function getNetworkGraph(options = {}, signal) {
  const isMultigraph = options.isMultigraph || false;

  try {
    const res = await apiClient('/api/network/graph', { signal });
    if (res.data && res.data.elements) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/network/graph unreachable. Using enriched demo network adapter.", err.message);
  }

  // Construct Cytoscape graph from enriched demo data
  const elements = [];

  // Nodes with 5 risk categories (Critical, High, Medium, Low, Unknown)
  DEMO_VESSELS.forEach(v => {
    // Map risk tier to 5 standard categories
    let riskCategory = "LOW";
    let riskSymbol = "✓";
    let riskColor = "#39D98A";

    if (v.risk_tier === "CRITICAL_MONITORING") {
      riskCategory = "CRITICAL";
      riskSymbol = "!";
      riskColor = "#FF5C65";
    } else if (v.risk_tier === "ELEVATED_ATTENTION") {
      riskCategory = "HIGH";
      riskSymbol = "▲";
      riskColor = "#FF9900";
    } else if (v.risk_tier === "MODERATE_INTERACTION") {
      riskCategory = "MEDIUM";
      riskSymbol = "●";
      riskColor = "#F5B942";
    } else if (v.risk_tier === "INSUFFICIENT_DATA" || v.ais_gap_count > 20) {
      riskCategory = "UNKNOWN";
      riskSymbol = "?";
      riskColor = "#94A3B8";
    }

    elements.push({
      data: {
        id: v.mmsi,
        label: v.vessel_name.replace("MOCK_", ""),
        fullName: v.vessel_name,
        flag: v.flag,
        vesselType: v.vessel_type,
        riskScore: v.composite_risk_score,
        riskTier: v.risk_tier,
        riskCategory,
        riskSymbol,
        riskColor,
        betweenness: v.betweenness_centrality,
        degree: v.degree_centrality,
        closeness: (0.35 + (v.degree_centrality || 0.1) * 0.45),
        aisGaps: v.ais_gap_count,
        spoofingCount: v.spoofing_incident_count,
        isDemo: true,
      }
    });
  });

  // Edges: Multigraph vs Simple Graph
  const rawEdges = isMultigraph ? DEMO_MULTIGRAPH_EDGES : collapseToSimpleGraph(DEMO_MULTIGRAPH_EDGES);

  rawEdges.forEach(e => {
    elements.push({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        interactionType: e.interactionType,
        label: e.label,
        count: e.count || 1,
        duration: e.duration,
        risk: e.risk,
        distance: e.distance,
        isVerified: e.isVerified !== false,
        evidence: e.evidence || "Operational bilateral maritime rendezvous.",
        timestamps: e.timestamps || { firstSeen: "2026-10-24 UTC", lastSeen: "2026-10-26 UTC" },
        sourceInfo: e.sourceInfo || "Coastal AIS Stream",
        curveOffset: e.curveOffset || 0,
        isDemo: true,
      }
    });
  });

  const demoGraph = {
    summary: {
      num_nodes: DEMO_VESSELS.length,
      num_edges: rawEdges.length,
      density: isMultigraph ? 0.2242 : 0.1818,
      is_connected: false,
      num_connected_components: 2,
      average_degree: isMultigraph ? 2.33 : 2.0,
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

/**
 * Collapses parallel multigraph edges into a single aggregated edge for simple graph mode.
 */
function collapseToSimpleGraph(edges = []) {
  const edgeMap = new Map();

  edges.forEach(e => {
    const pairKey = [e.source, e.target].sort().join('--');
    if (!edgeMap.has(pairKey)) {
      edgeMap.set(pairKey, {
        id: `simple-${pairKey}`,
        source: e.source,
        target: e.target,
        interactionType: e.interactionType,
        label: e.interactionType.replace(/_/g, ' '),
        count: e.count || 1,
        duration: e.duration,
        risk: e.risk,
        distance: e.distance,
        isVerified: e.isVerified !== false,
        evidence: e.evidence,
        timestamps: e.timestamps,
        sourceInfo: e.sourceInfo,
        curveOffset: 0,
      });
    } else {
      const existing = edgeMap.get(pairKey);
      existing.count += (e.count || 1);
      existing.risk = Math.max(existing.risk, e.risk);
      existing.duration += e.duration;
      if (!existing.isVerified || !e.isVerified) {
        existing.isVerified = existing.isVerified && e.isVerified;
      }
    }
  });

  return Array.from(edgeMap.values());
}

/**
 * Generates an initial list of network surveillance notifications.
 */
export function getInitialNetworkNotifications() {
  return [
    {
      id: "notif-01",
      vesselId: "999000001",
      vesselName: "MOCK_NEPTUNE_FEEDER",
      type: "new_high_risk",
      title: "New Critical Anomaly Rating",
      message: "Vessel composite divergence score increased above critical threshold (0.68) after dark passage.",
      timestamp: "12m ago",
      severity: "CRITICAL",
      isRead: false,
    },
    {
      id: "notif-02",
      vesselId: "999000006",
      vesselName: "MOCK_PACIFIC_STAR",
      type: "new_sts",
      title: "Bilateral STS Rendezvous Detected",
      message: "22.0h encounter with MOCK_AEGEAN_BRIDGE documented in Malta offshore waters.",
      timestamp: "45m ago",
      severity: "HIGH",
      isRead: false,
    },
    {
      id: "notif-03",
      vesselId: "999000005",
      vesselName: "MOCK_BALTIC_RUNNER",
      type: "new_ais_gap",
      title: "Consecutive Dark AIS Gap Alert",
      message: "Accumulated 15th dark transmission gap in Skagerrak corridor.",
      timestamp: "1h ago",
      severity: "HIGH",
      isRead: false,
    },
    {
      id: "notif-04",
      vesselId: "999000008",
      vesselName: "MOCK_ATLANTIC_PEARL",
      type: "centrality_shift",
      title: "Betweenness Centrality Shift",
      message: "Vessel betweenness increased by +0.08 after establishing bridge role to Algeciras cluster.",
      timestamp: "3h ago",
      severity: "MEDIUM",
      isRead: false,
    },
    {
      id: "notif-05",
      vesselId: "999000002",
      vesselName: "MOCK_OCEAN_SHADOW",
      type: "new_relationship",
      title: "New Shared Entity Link",
      message: "Documented corporate registry connection identified with support vessel MOCK_AEGEAN_ESCORT.",
      timestamp: "5h ago",
      severity: "LOW",
      isRead: true,
    },
  ];
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

