/**
 * DEMO DATA ADAPTER: Surveillance Triage Alerts
 */

export const DEMO_ALERTS = [
  {
    id: "ALT-101",
    level: "HIGH",
    category: "STS_PROXIMITY",
    title: "Laconic Gulf Multi-Tier Rendezvous Detected",
    timestamp: "2026-10-26 21:40 UTC",
    vessels: ["999000001", "999000002"],
    summary: "Bilateral proximity with draught delta consistent with ship-to-ship crude offload.",
    isDemo: true,
  },
  {
    id: "ALT-102",
    level: "MEDIUM",
    category: "DARK_CORRIDOR",
    title: "Skagerrak 15-Gap Cluster Identified",
    timestamp: "2026-10-26 18:10 UTC",
    vessels: ["999000005"],
    summary: "Vessel accumulated 15 dark gaps in transit passage; transponder resumed with modified destination.",
    isDemo: true,
  },
  {
    id: "ALT-103",
    level: "MEDIUM",
    category: "BRIDGE_HUB",
    title: "Crucial Network Bridge Role: MOCK_HORIZON_DEST",
    timestamp: "2026-10-26 12:00 UTC",
    vessels: ["999000010"],
    summary: "High betweenness centrality (0.2545) indicates critical intermediary feeder node linking clusters.",
    isDemo: true,
  },
  {
    id: "ALT-104",
    level: "LOW",
    category: "REGISTRY_INSPECTION",
    title: "Comoros Flag Registry Notice",
    timestamp: "2026-10-25 09:30 UTC",
    vessels: ["999000005"],
    summary: "High flag-of-convenience risk weight (0.85). Recommended for port state inspection priority.",
    isDemo: true,
  },
];
