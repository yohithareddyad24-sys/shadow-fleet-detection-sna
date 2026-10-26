/**
 * DEMO DATA ADAPTER: Anomaly Events
 * Logged indicators of evasive operational behaviour.
 */

export const DEMO_EVENTS = [
  {
    id: "EVT-8901",
    mmsi: "999000001",
    vessel_name: "MOCK_NEPTUNE_FEEDER",
    event_type: "AIS_TRANSMISSION_GAP",
    severity: "ELEVATED",
    timestamp: "2026-10-26 19:45 UTC",
    location: "Laconic Gulf Waters (36.42N, 22.85E)",
    details: "12.5h transponder blackout with +2.8m draught increase indicative of unmonitored transfer.",
    isDemo: true,
  },
  {
    id: "EVT-8902",
    mmsi: "999000006",
    vessel_name: "MOCK_PACIFIC_STAR",
    event_type: "STS_RENDEZVOUS",
    severity: "CRITICAL",
    timestamp: "2026-10-26 17:30 UTC",
    location: "Malta Hurd's Bank Anchorage (35.95N, 14.62E)",
    details: "22.0h bilateral zero-speed encounter with MOCK_AEGEAN_BRIDGE in international waters.",
    isDemo: true,
  },
  {
    id: "EVT-8903",
    mmsi: "999000005",
    vessel_name: "MOCK_BALTIC_RUNNER",
    event_type: "AIS_SPOOFING",
    severity: "ELEVATED",
    timestamp: "2026-10-26 11:20 UTC",
    location: "Skagerrak Approaches (57.72N, 11.96E)",
    details: "Kinematic discontinuity: 28 kn calculated speed vs 11 kn broadcast engine capability.",
    isDemo: true,
  },
  {
    id: "EVT-8904",
    mmsi: "999000008",
    vessel_name: "MOCK_ATLANTIC_PEARL",
    event_type: "LOITERING_PATTERN",
    severity: "MODERATE",
    timestamp: "2026-10-25 21:00 UTC",
    location: "Strait of Gibraltar (36.12N, -5.35W)",
    details: "Persistent holding pattern without declared cargo destination.",
    isDemo: true,
  },
  {
    id: "EVT-8905",
    mmsi: "999000002",
    vessel_name: "MOCK_OCEAN_SHADOW",
    event_type: "FLAG_SWITCH_ALERT",
    severity: "MODERATE",
    timestamp: "2026-10-25 15:40 UTC",
    location: "Eastern Mediterranean Waters",
    details: "Third flag state registry alteration recorded within 18 months.",
    isDemo: true,
  },
];
