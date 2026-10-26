from datetime import datetime, timezone

MOCK_DISCLAIMER = (
    "ACO and SNA metrics do NOT prove that a vessel is part of a shadow fleet, "
    "illicit operation, or sanctions evasion scheme. All metrics serve exclusively as "
    "exploratory triage tools to assist human maritime analysts in prioritizing investigations."
)

MOCK_VESSELS = [
    {
        "mmsi": "999000001",
        "name": "MOCK_NEPTUNE_FEEDER",
        "flag": "Panama",
        "vessel_type": "Crude Oil Tanker",
        "flag_risk_weight": 0.70,
        "ais_gap_count": 12,
        "spoofing_incident_count": 4,
        "risk_score": 0.84,
        "tier": "CRITICAL_MONITORING",
        "reasons": ["High Betweenness Centrality", "Frequent Dark AIS Gaps (>12h)", "Flag-of-Convenience Risk"],
        "degree": 0.50,
        "betweenness": 0.65,
        "community": 1,
        "lat": 1.250,
        "lon": 103.850,
        "speed": 1.1,
        "course": 115.0,
        "last_seen": datetime.now(timezone.utc).isoformat()
    },
    {
        "mmsi": "999000002",
        "name": "MOCK_OCEAN_SHADOW",
        "flag": "Liberia",
        "vessel_type": "Product Tanker",
        "flag_risk_weight": 0.65,
        "ais_gap_count": 8,
        "spoofing_incident_count": 2,
        "risk_score": 0.71,
        "tier": "CRITICAL_MONITORING",
        "reasons": ["Multiple STS Transfers", "Repeated Loitering in Straits"],
        "degree": 0.40,
        "betweenness": 0.48,
        "community": 1,
        "lat": 1.253,
        "lon": 103.854,
        "speed": 0.8,
        "course": 110.0,
        "last_seen": datetime.now(timezone.utc).isoformat()
    },
    {
        "mmsi": "999000004",
        "name": "MOCK_AEGEAN_BRIDGE",
        "flag": "Malta",
        "vessel_type": "Crude Oil Tanker",
        "flag_risk_weight": 0.40,
        "ais_gap_count": 5,
        "spoofing_incident_count": 1,
        "risk_score": 0.52,
        "tier": "ELEVATED_ATTENTION",
        "reasons": ["Intermediary Feeder Hub"],
        "degree": 0.25,
        "betweenness": 0.30,
        "community": 1,
        "lat": 1.310,
        "lon": 103.950,
        "speed": 6.2,
        "course": 240.0,
        "last_seen": datetime.now(timezone.utc).isoformat()
    },
    {
        "mmsi": "999000003",
        "name": "MOCK_TITAN_CARRIER",
        "flag": "Marshall Islands",
        "vessel_type": "Bulk Carrier",
        "flag_risk_weight": 0.20,
        "ais_gap_count": 0,
        "spoofing_incident_count": 0,
        "risk_score": 0.15,
        "tier": "BASELINE_LEGITIMATE",
        "reasons": ["Normal Commercial Transit"],
        "degree": 0.05,
        "betweenness": 0.02,
        "community": 2,
        "lat": 1.280,
        "lon": 103.820,
        "speed": 12.5,
        "course": 085.0,
        "last_seen": datetime.now(timezone.utc).isoformat()
    }
]

MOCK_INTERACTIONS = [
    {
        "vessel_a": "999000001",
        "vessel_b": "999000002",
        "interaction_type": "STS_TRANSFER",
        "count": 4,
        "avg_duration_hours": 8.5,
        "min_distance_nm": 0.04,
        "risk": 0.88
    },
    {
        "vessel_a": "999000002",
        "vessel_b": "999000004",
        "interaction_type": "LOITERING_PROXIMITY",
        "count": 2,
        "avg_duration_hours": 4.0,
        "min_distance_nm": 0.09,
        "risk": 0.70
    }
]
