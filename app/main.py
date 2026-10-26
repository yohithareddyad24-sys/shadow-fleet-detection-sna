from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.mock_data import MOCK_VESSELS, MOCK_INTERACTIONS, MOCK_DISCLAIMER

app = FastAPI(
    title="Shadow Fleet Detection API",
    version="1.0.0",
    description="Backend API supporting AIS Data Ingestion, SNA Graph Centralities, and ACO Pathfinding."
)

# Enable CORS for React frontend (localhost:3000 / localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ACORequest(BaseModel):
    source_mmsi: str
    destination_mmsi: str
    num_ants: Optional[int] = 20
    iterations: Optional[int] = 40


# --- Phase 3 Contract Endpoints for Member 2 ---

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/vessels")
def list_or_search_vessels(search: Optional[str] = Query(None)):
    """Search by MMSI or Vessel Name."""
    if not search:
        return MOCK_VESSELS
    s = search.lower()
    return [v for v in MOCK_VESSELS if s in v["mmsi"] or s in v["name"].lower()]


@app.get("/api/vessels/live")
def get_live_positions():
    """Latest GPS position of every active vessel for the live map."""
    return [
        {
            "mmsi": v["mmsi"],
            "name": v["name"],
            "lat": v["lat"],
            "lon": v["lon"],
            "speed": v["speed"],
            "course": v["course"],
            "tier": v["tier"],
            "last_seen": v["last_seen"]
        }
        for v in MOCK_VESSELS
    ]


@app.get("/api/vessels/{mmsi}")
def get_vessel_detail(mmsi: str):
    """Detailed vessel profile and risk explanation."""
    for v in MOCK_VESSELS:
        if v["mmsi"] == mmsi:
            return v
    raise HTTPException(status_code=404, detail="Vessel not found")


@app.get("/api/vessels/{mmsi}/trajectory")
def get_trajectory(mmsi: str, hours: int = Query(24, ge=1, le=168)):
    """Ordered historical track coordinates for drawing polylines on Leaflet/MapLibre."""
    v = next((item for item in MOCK_VESSELS if item["mmsi"] == mmsi), None)
    if not v:
        raise HTTPException(status_code=404, detail="Vessel not found")
    
    base_lat, base_lon = v["lat"], v["lon"]
    return [
        {"ts": "2026-03-01T04:00:00Z", "lat": base_lat - 0.04, "lon": base_lon - 0.06, "speed": 11.2},
        {"ts": "2026-03-01T08:00:00Z", "lat": base_lat - 0.02, "lon": base_lon - 0.03, "speed": 7.5},
        {"ts": "2026-03-01T12:00:00Z", "lat": base_lat, "lon": base_lon, "speed": v["speed"]},
    ]


@app.get("/api/risk/ranking")
def get_risk_ranking(top: int = Query(20, ge=1, le=100)):
    """Ranked vessels by composite risk score with explainable drivers."""
    sorted_vessels = sorted(MOCK_VESSELS, key=lambda x: x["risk_score"], reverse=True)[:top]
    return {
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": MOCK_DISCLAIMER,
        "ranking": [
            {
                "rank": i + 1,
                "mmsi": v["mmsi"],
                "name": v["name"],
                "risk_score": v["risk_score"],
                "tier": v["tier"],
                "reasons": v["reasons"]
            }
            for i, v in enumerate(sorted_vessels)
        ]
    }


@app.get("/api/network/graph")
def get_network_graph():
    """Graph nodes and edges for React graph visualization (Vis.js / Cytoscape)."""
    nodes = [
        {
            "id": v["mmsi"],
            "label": v["name"],
            "tier": v["tier"],
            "risk_score": v["risk_score"],
            "degree": v["degree"],
            "betweenness": v["betweenness"]
        }
        for v in MOCK_VESSELS
    ]
    edges = [
        {
            "source": e["vessel_a"],
            "target": e["vessel_b"],
            "type": e["interaction_type"],
            "count": e["count"],
            "risk": e["risk"],
            "avg_duration_hours": e["avg_duration_hours"]
        }
        for e in MOCK_INTERACTIONS
    ]
    return {"nodes": nodes, "edges": edges}


@app.get("/api/network/communities")
def get_network_communities():
    """Connected components / communities in the vessel network."""
    return {
        "total_communities": 2,
        "communities": [
            {
                "community_id": 1,
                "vessel_count": 3,
                "mmsis": ["999000001", "999000002", "999000004"],
                "label": "Suspected STS Cluster 1"
            },
            {
                "community_id": 2,
                "vessel_count": 1,
                "mmsis": ["999000003"],
                "label": "Harbor Patrol Community"
            }
        ]
    }


@app.post("/api/aco/path")
def run_aco_path(req: ACORequest):
    """Run Ant Colony Optimization pathfinding between two vessels."""
    return {
        "path_found": True,
        "path": [req.source_mmsi, "999000002", req.destination_mmsi],
        "hops": [
            {"from": req.source_mmsi, "to": "999000002", "risk": 0.88, "type": "STS_TRANSFER"},
            {"from": "999000002", "to": req.destination_mmsi, "risk": 0.70, "type": "LOITERING_PROXIMITY"}
        ],
        "cumulative_risk": 1.58,
        "fitness": 1.117,
        "disclaimer": MOCK_DISCLAIMER
    }


@app.get("/api/status/ingestion")
def get_ingestion_status():
    """Status check indicating if live AIS stream is currently flowing."""
    return {
        "is_streaming": True,
        "latest_message_ts": datetime.now(timezone.utc).isoformat(),
        "messages_last_minute": 38,
        "active_vessels_in_bbox": len(MOCK_VESSELS)
    }
