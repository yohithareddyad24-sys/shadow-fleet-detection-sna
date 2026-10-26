from datetime import datetime, timezone, timedelta
from typing import Optional, List
import networkx as nx
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db, Vessel, Position, Interaction, RiskResult
from analysis.aco_optimizer import AntColonyPathOptimizer

DISCLAIMER = (
    "ACO and SNA metrics do NOT prove that a vessel is part of a shadow fleet, "
    "illicit operation, or sanctions evasion scheme. All metrics serve exclusively as "
    "exploratory triage tools to assist human maritime analysts in prioritizing investigations."
)

app = FastAPI(
    title="Shadow Fleet Detection API",
    version="1.0.0",
    description="Production backend service querying live SQLite records, SNA centralities, and ACO path optimization."
)

# CORS configuration for Frontend Dashboard
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
    num_ants: Optional[int] = 15
    iterations: Optional[int] = 30


# --- Phase 9 Database-Backed Endpoints ---

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check validating backend and database connectivity."""
    vessel_count = db.query(Vessel).count()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "vessels_tracked": vessel_count,
    }


@app.get("/api/vessels")
def list_or_search_vessels(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Search tracked vessels by MMSI or name from the database."""
    query = db.query(Vessel, RiskResult).outerjoin(RiskResult, Vessel.mmsi == RiskResult.mmsi)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Vessel.mmsi.ilike(s)) | (Vessel.name.ilike(s)))

    rows = query.limit(100).all()
    results = []
    for v, r in rows:
        results.append({
            "mmsi": v.mmsi,
            "name": v.name or f"Vessel_{v.mmsi}",
            "flag": "Panama" if str(v.mmsi)[:3] == "352" else "Liberia",
            "ship_type": v.ship_type,
            "imo": v.imo,
            "risk_score": r.score if r else 0.1,
            "tier": r.tier if r else "BASELINE_LEGITIMATE",
            "reasons": r.reasons if r and r.reasons else ["Normal navigation"],
            "degree": r.degree if r else 0.0,
            "betweenness": r.betweenness if r else 0.0,
            "last_seen": v.last_seen.isoformat() if v.last_seen else None,
        })
    return results


@app.get("/api/vessels/live")
def get_live_positions(db: Session = Depends(get_db)):
    """Latest GPS position of every vessel for map marker display."""
    # Subquery to retrieve maximum timestamp per MMSI
    subq = db.query(Position.mmsi, func.max(Position.ts).label("max_ts")).group_by(Position.mmsi).subquery()
    latest_positions = (
        db.query(Position, Vessel, RiskResult)
        .join(subq, (Position.mmsi == subq.c.mmsi) & (Position.ts == subq.c.max_ts))
        .join(Vessel, Position.mmsi == Vessel.mmsi)
        .outerjoin(RiskResult, Position.mmsi == RiskResult.mmsi)
        .all()
    )

    return [
        {
            "mmsi": p.mmsi,
            "name": v.name or f"Vessel_{p.mmsi}",
            "lat": p.lat,
            "lon": p.lon,
            "speed": p.speed,
            "course": 0.0,
            "tier": r.tier if r else "BASELINE_LEGITIMATE",
            "last_seen": p.ts.isoformat(),
        }
        for p, v, r in latest_positions
    ]


@app.get("/api/vessels/{mmsi}")
def get_vessel_detail(mmsi: str, db: Session = Depends(get_db)):
    """Deep profile of a vessel including risk metrics and rendezvous peers."""
    v = db.get(Vessel, mmsi)
    if not v:
        raise HTTPException(status_code=404, detail="Vessel not found")

    r = db.get(RiskResult, mmsi)
    latest_pos = db.query(Position).filter(Position.mmsi == mmsi).order_by(Position.ts.desc()).first()

    # Get rendezvous interaction peers
    interactions = (
        db.query(Interaction)
        .filter((Interaction.mmsi_a == mmsi) | (Interaction.mmsi_b == mmsi))
        .all()
    )
    peers = []
    for item in interactions:
        peer_mmsi = item.mmsi_b if item.mmsi_a == mmsi else item.mmsi_a
        peers.append({
            "peer_mmsi": peer_mmsi,
            "interaction_count": item.count,
            "avg_duration_hours": item.avg_duration_hours,
            "min_distance_nm": item.min_distance_nm,
            "risk": item.risk,
        })

    return {
        "mmsi": v.mmsi,
        "name": v.name or f"Vessel_{v.mmsi}",
        "ship_type": v.ship_type,
        "flag_mid": v.flag_mid,
        "imo": v.imo,
        "last_seen": v.last_seen.isoformat() if v.last_seen else None,
        "risk_score": r.score if r else 0.1,
        "tier": r.tier if r else "BASELINE_LEGITIMATE",
        "reasons": r.reasons if r and r.reasons else ["Normal navigation"],
        "degree": r.degree if r else 0.0,
        "betweenness": r.betweenness if r else 0.0,
        "gap_count": r.gap_count if r else 0,
        "community": r.community if r else 1,
        "lat": latest_pos.lat if latest_pos else None,
        "lon": latest_pos.lon if latest_pos else None,
        "speed": latest_pos.speed if latest_pos else None,
        "connected_peers": peers,
    }


@app.get("/api/vessels/{mmsi}/trajectory")
def get_trajectory(mmsi: str, hours: int = Query(24, ge=1, le=168), db: Session = Depends(get_db)):
    """Historical GPS trajectory points for drawing map polylines."""
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours)
    points = (
        db.query(Position)
        .filter(Position.mmsi == mmsi, Position.ts >= since)
        .order_by(Position.ts.asc())
        .all()
    )
    if not points:
        raise HTTPException(status_code=404, detail="No trajectory records found for this vessel.")

    return [{"ts": p.ts.isoformat(), "lat": p.lat, "lon": p.lon, "speed": p.speed} for p in points]


@app.get("/api/risk/ranking")
def get_risk_ranking(top: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Ranked vessels by composite risk score with primary driver explanations."""
    rows = (
        db.query(RiskResult, Vessel)
        .join(Vessel, Vessel.mmsi == RiskResult.mmsi)
        .order_by(RiskResult.score.desc())
        .limit(top)
        .all()
    )
    return {
        "computed_at": rows[0][0].computed_at.isoformat() if rows else datetime.now(timezone.utc).isoformat(),
        "disclaimer": DISCLAIMER,
        "ranking": [
            {
                "rank": i + 1,
                "mmsi": r.mmsi,
                "name": v.name or f"Vessel_{r.mmsi}",
                "risk_score": r.score,
                "tier": r.tier,
                "reasons": r.reasons,
                "degree": r.degree,
                "betweenness": r.betweenness,
            }
            for i, (r, v) in enumerate(rows)
        ]
    }


@app.get("/api/network/graph")
def get_network_graph(db: Session = Depends(get_db)):
    """Attributed nodes and edges formatted for React graph visualization."""
    risk_nodes = (
        db.query(RiskResult, Vessel)
        .join(Vessel, Vessel.mmsi == RiskResult.mmsi)
        .all()
    )
    interactions = db.query(Interaction).all()

    nodes = [
        {
            "id": r.mmsi,
            "label": v.name or f"Vessel_{r.mmsi}",
            "tier": r.tier,
            "risk_score": r.score,
            "degree": r.degree,
            "betweenness": r.betweenness,
            "community": r.community,
        }
        for r, v in risk_nodes
    ]

    edges = [
        {
            "source": item.mmsi_a,
            "target": item.mmsi_b,
            "type": "STS_TRANSFER",
            "count": item.count,
            "risk": item.risk,
            "avg_duration_hours": item.avg_duration_hours,
            "min_distance_nm": item.min_distance_nm,
        }
        for item in interactions
    ]

    return {"nodes": nodes, "edges": edges}


@app.get("/api/network/communities")
def get_network_communities(db: Session = Depends(get_db)):
    """Community partitions isolating independent clusters of maritime activity."""
    rows = db.query(RiskResult).all()
    if not rows:
        return {"total_communities": 0, "communities": []}

    comm_map = {}
    for r in rows:
        comm_map.setdefault(r.community, []).append(r.mmsi)

    communities = [
        {
            "community_id": cid,
            "vessel_count": len(mmsis),
            "mmsis": mmsis,
            "label": f"Cluster {cid}"
        }
        for cid, mmsis in sorted(comm_map.items())
    ]
    return {"total_communities": len(communities), "communities": communities}


@app.post("/api/aco/path")
def run_aco_path(req: ACORequest, db: Session = Depends(get_db)):
    """
    Executes Ant Colony Optimization (ACO) heuristic path search:
    Finds the optimal multi-hop transfer pathway connecting origin tanker
    and destination vessel maximizing cumulative interaction risk.
    """
    interactions = db.query(Interaction).all()
    if not interactions:
        raise HTTPException(status_code=400, detail="No interaction edges found in database to construct graph.")

    # Reconstruct graph from SQLite interactions
    G = nx.Graph()
    for item in interactions:
        G.add_node(item.mmsi_a, vessel_name=f"Vessel_{item.mmsi_a}")
        G.add_node(item.mmsi_b, vessel_name=f"Vessel_{item.mmsi_b}")
        G.add_edge(
            item.mmsi_a,
            item.mmsi_b,
            interaction_risk=item.risk,
            interaction_count=item.count,
            avg_distance_nm=item.min_distance_nm,
            weight=item.risk,
        )

    if not G.has_node(req.source_mmsi):
        raise HTTPException(status_code=404, detail=f"Source MMSI '{req.source_mmsi}' not present in interaction network.")
    if not G.has_node(req.destination_mmsi):
        raise HTTPException(status_code=404, detail=f"Destination MMSI '{req.destination_mmsi}' not present in interaction network.")

    optimizer = AntColonyPathOptimizer(
        graph=G,
        num_ants=req.num_ants or 15,
        num_iterations=req.iterations or 30,
    )

    res = optimizer.find_optimal_path(source=req.source_mmsi, destination=req.destination_mmsi)

    hops = []
    if res.best_path and len(res.best_path) >= 2:
        for i in range(len(res.best_path) - 1):
            u, v = res.best_path[i], res.best_path[i + 1]
            edge_data = G.get_edge_data(u, v) or {}
            hops.append({
                "from": u,
                "to": v,
                "risk": edge_data.get("interaction_risk", 0.5),
                "type": "STS_TRANSFER",
            })

    return {
        "path_found": res.found_valid_path,
        "path": res.best_path,
        "path_vessel_names": res.best_path_vessel_names,
        "hops": hops,
        "cumulative_risk": round(res.cumulative_risk, 4),
        "fitness": round(res.path_fitness, 4),
        "total_hops": res.total_hops,
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/status/ingestion")
def get_ingestion_status(db: Session = Depends(get_db)):
    """Heartbeat endpoint indicating if live data is flowing."""
    total_positions = db.query(Position).count()
    total_vessels = db.query(Vessel).count()
    latest_pos = db.query(Position).order_by(Position.ts.desc()).first()

    return {
        "is_streaming": total_positions > 0,
        "latest_message_ts": latest_pos.ts.isoformat() if latest_pos else None,
        "total_positions_stored": total_positions,
        "active_vessels_in_bbox": total_vessels,
    }
