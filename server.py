"""
FastAPI Backend Server for Shadow Fleet AI Platform.
Wraps Member 3's Social Network Analysis (SNA) and Ant Colony Optimization (ACO) modules.
"""

from pathlib import Path
import sys
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx

# Add current dir to path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from analysis.graph_builder import (
    load_vessel_data,
    load_interaction_data,
    build_vessel_graph,
    get_graph_summary,
)
from analysis.sna_metrics import (
    compute_sna_metrics,
    extract_connected_components,
    get_top_influential_vessels,
)
from analysis.risk_scoring import compute_composite_risk_scores
from analysis.aco_optimizer import AntColonyPathOptimizer

app = FastAPI(
    title="Shadow Fleet AI — Maritime Intelligence API",
    description="SNA & ACO Maritime Risk Assessment Engine",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Geographic anchors for synthetic demonstration positions
VESSEL_GEO_ANCHORS = {
    "999000001": {"lat": 36.42, "lng": 22.85, "port": "Laconic Gulf (Offshore)", "heading": 142, "speed": 1.2, "status": "LOITERING"},
    "999000002": {"lat": 36.48, "lng": 22.91, "port": "Laconic Gulf STS Area", "heading": 138, "speed": 0.8, "status": "STS_OPERATION"},
    "999000003": {"lat": 1.28, "lng": 103.85, "port": "Singapore Anchorage", "heading": 85, "speed": 11.4, "status": "UNDERWAY"},
    "999000004": {"lat": 35.89, "lng": 14.51, "port": "Malta Hurd's Bank", "heading": 210, "speed": 0.5, "status": "STS_OPERATION"},
    "999000005": {"lat": 57.72, "lng": 11.96, "port": "Skagerrak Approaches", "heading": 315, "speed": 3.4, "status": "ANOMALOUS_DRIFT"},
    "999000006": {"lat": 35.95, "lng": 14.62, "port": "Malta Offshore Transfer Zone", "heading": 195, "speed": 0.6, "status": "STS_OPERATION"},
    "999000007": {"lat": 1.34, "lng": 104.12, "port": "Eastern Singapore Strait", "heading": 72, "speed": 8.5, "status": "UNDERWAY"},
    "999000008": {"lat": 36.12, "lng": -5.35, "port": "Strait of Gibraltar (Eastern Anchor)", "heading": 260, "speed": 2.1, "status": "LOITERING"},
    "999000009": {"lat": 36.38, "lng": 22.79, "port": "Laconic Gulf Support Area", "heading": 140, "speed": 4.5, "status": "ESCORT_SUPPORT"},
    "999000010": {"lat": 36.05, "lng": -5.28, "port": "Algeciras Approaches", "heading": 275, "speed": 9.8, "status": "UNDERWAY"},
    "999000011": {"lat": -17.73, "lng": 168.32, "port": "Port Vila Offshore", "heading": 45, "speed": 3.0, "status": "FISHING_OPERATION"},
    "999000012": {"lat": 17.49, "lng": -88.19, "port": "Belize City Roadstead", "heading": 110, "speed": 0.0, "status": "ANCHORED"},
}

VESSEL_DETAILS_EXTRA = {
    "999000001": {
        "imo": "9248102",
        "dwt": 105400,
        "year_built": 2003,
        "registered_owner": "Alcyone Maritime Ltd (Marshall Islands SPV)",
        "commercial_operator": "Pontus Ocean Shipmanagement (Dubai)",
        "beneficial_owner": "Undisclosed Holding Entity (UAE)",
        "draught_m": 14.8,
        "destination": "UNKNOWN / FOR ORDERS",
        "eta": "2026-10-28 14:00 UTC",
    },
    "999000002": {
        "imo": "9312564",
        "dwt": 74999,
        "year_built": 2005,
        "registered_owner": "Silver Tides Shipping Corp (Liberia)",
        "commercial_operator": "Nautilus Marine Services (Istanbul)",
        "beneficial_owner": "Trans-Caspian Energy Holdings",
        "draught_m": 12.2,
        "destination": "HIGH SEAS STS",
        "eta": "2026-10-27 08:30 UTC",
    },
    "999000004": {
        "imo": "9194567",
        "dwt": 159200,
        "year_built": 2001,
        "registered_owner": "Aegean Zenith Co (Malta)",
        "commercial_operator": "Helios Marine Trading",
        "beneficial_owner": "Mediterranean Energy Traders S.A.",
        "draught_m": 16.5,
        "destination": "MALTA OFFSHORE",
        "eta": "2026-10-29 18:00 UTC",
    },
    "999000005": {
        "imo": "9283741",
        "dwt": 49990,
        "year_built": 2004,
        "registered_owner": "Nordic Wave Shipping Inc",
        "commercial_operator": "Aurora Ship Management",
        "beneficial_owner": "Eastern Baltic Logistics FZE",
        "draught_m": 11.4,
        "destination": "FOR ORDERS",
        "eta": "2026-10-30 06:00 UTC",
    },
    "999000006": {
        "imo": "9215890",
        "dwt": 298500,
        "year_built": 2002,
        "registered_owner": "Pacific Star Marine SA (Gabon)",
        "commercial_operator": "Oceanic Matrix Ltd (Hong Kong)",
        "beneficial_owner": "Horizon Golden Holdings",
        "draught_m": 20.8,
        "destination": "OFFSHORE STS TRANSFER",
        "eta": "2026-10-27 22:00 UTC",
    },
    "999000008": {
        "imo": "9299412",
        "dwt": 113000,
        "year_built": 2006,
        "registered_owner": "Pearl Maritime Ventures",
        "commercial_operator": "Atlas Bunkering & Logistics",
        "beneficial_owner": "Equator Navigation Inc",
        "draught_m": 14.1,
        "destination": "GIBRALTAR STRAIT",
        "eta": "2026-10-29 11:30 UTC",
    },
}

# In-memory database of investigation cases
investigation_cases = [
    {
        "id": "CASE-2026-0891",
        "title": "Laconic Gulf Multi-Tier STS Rendezvous Chain",
        "created_at": "2026-10-25 14:30 UTC",
        "status": "OPEN_INVESTIGATION",
        "priority": "HIGH",
        "analyst": "Operational Desk 03",
        "vessels": ["999000001", "999000002", "999000004", "999000006"],
        "notes": "Observed 18.5h proximity event between MOCK_NEPTUNE_FEEDER and MOCK_OCEAN_SHADOW with draft variance. Follow-up transfer chain identified leading towards Malta Hurd Bank.",
    },
    {
        "id": "CASE-2026-0892",
        "title": "Skagerrak Dark AIS Gap & Speed Anomaly",
        "created_at": "2026-10-26 09:15 UTC",
        "status": "IN_REVIEW",
        "priority": "MEDIUM",
        "analyst": "Operational Desk 01",
        "vessels": ["999000005"],
        "notes": "15 consecutive AIS transmission gaps totaling 72 hours unmonitored passage. Transponder reactivated with modified declared destination.",
    }
]

# Models
class ACORequest(BaseModel):
    source: str
    destination: str
    num_ants: Optional[int] = 15
    num_iterations: Optional[int] = 25
    alpha: Optional[float] = 1.0
    beta: Optional[float] = 2.0
    evaporation_rate: Optional[float] = 0.2

class InvestigationCase(BaseModel):
    title: str
    priority: str = "MEDIUM"
    vessels: List[str]
    notes: str

# Helper to load live pipeline data
def get_pipeline_data():
    base_dir = current_dir
    data_dir = base_dir / "data"
    vessels_df = load_vessel_data(data_dir / "sample_vessels.csv")
    interactions_df = load_interaction_data(data_dir / "sample_interactions.csv")
    G = build_vessel_graph(vessels_df, interactions_df, directed=False)
    sna_df = compute_sna_metrics(G)
    risk_df = compute_composite_risk_scores(sna_df)
    return vessels_df, interactions_df, G, sna_df, risk_df

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Shadow Fleet AI Intelligence Server",
        "engine": "NetworkX + SNA + ACO",
        "disclaimer": "Synthetic demonstration environment for research and behavioral anomaly triage.",
    }

@app.get("/api/vessels")
def list_vessels():
    _, _, _, _, risk_df = get_pipeline_data()
    vessels = []
    for _, row in risk_df.iterrows():
        mmsi = str(row["mmsi"])
        geo = VESSEL_GEO_ANCHORS.get(mmsi, {"lat": 30.0, "lng": 20.0, "port": "International Waters", "heading": 0, "speed": 0, "status": "IDLE"})
        extra = VESSEL_DETAILS_EXTRA.get(mmsi, {
            "imo": f"9{mmsi[-6:]}",
            "dwt": 85000,
            "year_built": 2005,
            "registered_owner": "Independent Maritime Carrier",
            "commercial_operator": "Global Ocean Management",
            "beneficial_owner": "Private Shipping Group",
            "draught_m": 12.0,
            "destination": "MEDITERRANEAN SEA",
            "eta": "2026-10-29 12:00 UTC",
        })
        
        vessels.append({
            "mmsi": mmsi,
            "vessel_name": row["vessel_name"],
            "flag": row["flag"],
            "vessel_type": row["vessel_type"],
            "flag_risk_weight": float(row["flag_risk_weight"]),
            "ais_gap_count": int(row["ais_gap_count"]),
            "spoofing_incident_count": int(row["spoofing_incident_count"]),
            "degree_centrality": float(row["degree_centrality"]),
            "betweenness_centrality": float(row["betweenness_centrality"]),
            "composite_risk_score": float(row["composite_risk_score"]),
            "risk_tier": row["risk_tier"],
            "primary_risk_driver": row["primary_risk_driver"],
            "lat": geo["lat"],
            "lng": geo["lng"],
            "port": geo["port"],
            "heading": geo["heading"],
            "speed": geo["speed"],
            "status": geo["status"],
            "imo": extra["imo"],
            "dwt": extra["dwt"],
            "year_built": extra["year_built"],
            "registered_owner": extra["registered_owner"],
            "commercial_operator": extra["commercial_operator"],
            "beneficial_owner": extra["beneficial_owner"],
            "draught_m": extra["draught_m"],
            "destination": extra["destination"],
            "eta": extra["eta"],
        })
    return vessels

@app.get("/api/vessels/{mmsi}")
def get_vessel(mmsi: str):
    _, _, G, sna_df, risk_df = get_pipeline_data()
    vessel_row = risk_df[risk_df["mmsi"] == mmsi]
    if vessel_row.empty:
        raise HTTPException(status_code=404, detail=f"Vessel MMSI {mmsi} not found.")
    
    row = vessel_row.iloc[0]
    geo = VESSEL_GEO_ANCHORS.get(mmsi, {"lat": 30.0, "lng": 20.0, "port": "International Waters", "heading": 0, "speed": 0, "status": "IDLE"})
    extra = VESSEL_DETAILS_EXTRA.get(mmsi, {
        "imo": f"9{mmsi[-6:]}",
        "dwt": 85000,
        "year_built": 2005,
        "registered_owner": "Independent Maritime Carrier",
        "commercial_operator": "Global Ocean Management",
        "beneficial_owner": "Private Shipping Group",
        "draught_m": 12.0,
        "destination": "MEDITERRANEAN SEA",
        "eta": "2026-10-29 12:00 UTC",
    })

    # Connected neighbors
    neighbors = []
    if G.has_node(mmsi):
        for n in G.neighbors(mmsi):
            edge_data = G.get_edge_data(mmsi, n)
            target_row = risk_df[risk_df["mmsi"] == n]
            target_name = target_row["vessel_name"].values[0] if not target_row.empty else n
            neighbors.append({
                "target_mmsi": n,
                "target_name": target_name,
                "interaction_type": edge_data.get("interaction_type", "RENDEZVOUS"),
                "interaction_count": edge_data.get("interaction_count", 1),
                "avg_duration_hours": edge_data.get("avg_duration_hours", 4.0),
                "interaction_risk": edge_data.get("interaction_risk", 0.5),
                "avg_distance_nm": edge_data.get("avg_distance_nm", 0.1),
            })

    # Historical trajectory points (synthetic illustrative trail)
    base_lat = geo["lat"]
    base_lng = geo["lng"]
    trajectory = [
        {"timestamp": "2026-10-24 06:00 UTC", "lat": base_lat - 0.9, "lng": base_lng - 1.2, "speed": 12.4, "course": 140, "event": "AIS_ACTIVE"},
        {"timestamp": "2026-10-24 18:00 UTC", "lat": base_lat - 0.6, "lng": base_lng - 0.8, "speed": 11.8, "course": 138, "event": "AIS_ACTIVE"},
        {"timestamp": "2026-10-25 04:00 UTC", "lat": base_lat - 0.3, "lng": base_lng - 0.4, "speed": 6.2, "course": 145, "event": "SPEED_REDUCTION"},
        {"timestamp": "2026-10-25 12:00 UTC", "lat": base_lat - 0.1, "lng": base_lng - 0.1, "speed": 1.1, "course": 142, "event": "STS_RENDEZVOUS_START"},
        {"timestamp": "2026-10-26 06:00 UTC", "lat": base_lat, "lng": base_lng, "speed": geo["speed"], "course": geo["heading"], "event": geo["status"]},
    ]

    # Dark AIS Gaps list
    gaps = []
    if int(row["ais_gap_count"]) > 0:
        gaps.append({
            "gap_id": f"GAP-{mmsi}-01",
            "start_time": "2026-10-24 22:15 UTC",
            "end_time": "2026-10-25 10:45 UTC",
            "duration_hours": 12.5,
            "last_known_pos": f"{base_lat - 0.4:.2f}N, {base_lng - 0.5:.2f}E",
            "reappearance_pos": f"{base_lat - 0.1:.2f}N, {base_lng - 0.1:.2f}E",
            "estimated_speed_discrepancy_knots": "+4.1 kn",
            "draught_delta_m": "+2.8 m (indicative of cargo loading)",
            "risk_assessment": "Transmission cessation in international waters adjacent to known STS anchorage",
        })
    if int(row["ais_gap_count"]) > 4:
        gaps.append({
            "gap_id": f"GAP-{mmsi}-02",
            "start_time": "2026-10-22 03:00 UTC",
            "end_time": "2026-10-22 17:30 UTC",
            "duration_hours": 14.5,
            "last_known_pos": f"{base_lat - 1.5:.2f}N, {base_lng - 1.9:.2f}E",
            "reappearance_pos": f"{base_lat - 1.0:.2f}N, {base_lng - 1.3:.2f}E",
            "estimated_speed_discrepancy_knots": "+1.8 kn",
            "draught_delta_m": "No significant change",
            "risk_assessment": "Unexplained AIS blackout during transit corridor passage",
        })

    return {
        "mmsi": mmsi,
        "vessel_name": row["vessel_name"],
        "flag": row["flag"],
        "vessel_type": row["vessel_type"],
        "flag_risk_weight": float(row["flag_risk_weight"]),
        "ais_gap_count": int(row["ais_gap_count"]),
        "spoofing_incident_count": int(row["spoofing_incident_count"]),
        "degree_centrality": float(row["degree_centrality"]),
        "betweenness_centrality": float(row["betweenness_centrality"]),
        "contrib_degree": float(row["contrib_degree"]),
        "contrib_betweenness": float(row["contrib_betweenness"]),
        "contrib_flag": float(row["contrib_flag"]),
        "contrib_ais_gaps": float(row["contrib_ais_gaps"]),
        "contrib_spoofing": float(row["contrib_spoofing"]),
        "composite_risk_score": float(row["composite_risk_score"]),
        "risk_tier": row["risk_tier"],
        "primary_risk_driver": row["primary_risk_driver"],
        "lat": geo["lat"],
        "lng": geo["lng"],
        "port": geo["port"],
        "heading": geo["heading"],
        "speed": geo["speed"],
        "status": geo["status"],
        "imo": extra["imo"],
        "dwt": extra["dwt"],
        "year_built": extra["year_built"],
        "registered_owner": extra["registered_owner"],
        "commercial_operator": extra["commercial_operator"],
        "beneficial_owner": extra["beneficial_owner"],
        "draught_m": extra["draught_m"],
        "destination": extra["destination"],
        "eta": extra["eta"],
        "neighbors": neighbors,
        "trajectory": trajectory,
        "ais_gaps": gaps,
        "disclaimer": "Analysis indicates anomalous behavioral patterns consistent with evasive operations. Requires human maritime intelligence verification.",
    }

@app.get("/api/network/graph")
def get_network_graph():
    _, interactions_df, G, sna_df, risk_df = get_pipeline_data()
    summary = get_graph_summary(G)
    components = extract_connected_components(G)
    
    risk_dict = dict(zip(risk_df["mmsi"], risk_df["composite_risk_score"]))
    name_dict = dict(zip(risk_df["mmsi"], risk_df["vessel_name"]))
    flag_dict = dict(zip(risk_df["mmsi"], risk_df["flag"]))
    tier_dict = dict(zip(risk_df["mmsi"], risk_df["risk_tier"]))
    betw_dict = dict(zip(risk_df["mmsi"], risk_df["betweenness_centrality"]))
    deg_dict = dict(zip(risk_df["mmsi"], risk_df["degree_centrality"]))
    
    # Cytoscape formatted elements
    elements = []
    
    # Nodes
    for node in G.nodes():
        elements.append({
            "data": {
                "id": str(node),
                "label": name_dict.get(str(node), str(node)).replace("MOCK_", ""),
                "fullName": name_dict.get(str(node), str(node)),
                "flag": flag_dict.get(str(node), "Unknown"),
                "riskScore": risk_dict.get(str(node), 0.2),
                "riskTier": tier_dict.get(str(node), "BASELINE_LEGITIMATE"),
                "betweenness": betw_dict.get(str(node), 0.0),
                "degree": deg_dict.get(str(node), 0.0),
            }
        })
        
    # Edges
    for u, v, data in G.edges(data=True):
        elements.append({
            "data": {
                "id": f"{u}-{v}",
                "source": str(u),
                "target": str(v),
                "interactionType": data.get("interaction_type", "RENDEZVOUS"),
                "count": data.get("interaction_count", 1),
                "duration": data.get("avg_duration_hours", 4.0),
                "risk": data.get("interaction_risk", 0.5),
                "distance": data.get("avg_distance_nm", 0.1),
            }
        })
        
    return {
        "summary": summary,
        "components": components,
        "elements": elements,
    }

@app.post("/api/optimizer/aco-path")
def run_aco_path(req: ACORequest):
    _, _, G, _, risk_df = get_pipeline_data()
    
    if not G.has_node(req.source):
        raise HTTPException(status_code=400, detail=f"Source vessel {req.source} not in graph.")
    if not G.has_node(req.destination):
        raise HTTPException(status_code=400, detail=f"Destination vessel {req.destination} not in graph.")
        
    aco = AntColonyPathOptimizer(
        G,
        num_ants=req.num_ants or 15,
        num_iterations=req.num_iterations or 25,
        alpha=req.alpha or 1.0,
        beta=req.beta or 2.0,
        evaporation_rate=req.evaporation_rate or 0.2,
        seed=42,
    )
    result = aco.find_optimal_path(req.source, req.destination)
    
    # Add coordinates for hops so map can project the pathway
    hops_with_coords = []
    for mmsi in result.best_path:
        geo = VESSEL_GEO_ANCHORS.get(mmsi, {"lat": 35.0, "lng": 20.0, "port": "Sea", "heading": 0, "speed": 0, "status": "TRANSIT"})
        v_name = risk_df[risk_df["mmsi"] == mmsi]["vessel_name"].values[0] if not risk_df[risk_df["mmsi"] == mmsi].empty else mmsi
        hops_with_coords.append({
            "mmsi": mmsi,
            "vessel_name": v_name,
            "lat": geo["lat"],
            "lng": geo["lng"],
            "port": geo["port"],
        })
        
    res_dict = result.to_dict()
    res_dict["hops_with_coords"] = hops_with_coords
    res_dict["convergence_history"] = result.convergence_history
    return res_dict

@app.get("/api/metrics/summary")
def get_metrics_summary():
    _, interactions_df, G, sna_df, risk_df = get_pipeline_data()
    
    tier_counts = risk_df["risk_tier"].value_counts().to_dict()
    flag_counts = risk_df["flag"].value_counts().to_dict()
    
