"""
Vessel Interaction Graph Builder.

Constructs maritime interaction graphs from vessel metadata and observed or explicitly
defined interaction events using NetworkX and Pandas.

DISCLAIMER: All sample data used in this project is strictly synthetic and intended
for research, testing, and algorithmic demonstration only. Not real AIS observations.
"""

from pathlib import Path
from typing import Dict, Any, Union, Optional
import networkx as nx
import pandas as pd


def load_vessel_data(source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
    """
    Load vessel metadata into a cleaned Pandas DataFrame.

    Args:
        source: Filepath to CSV or an existing DataFrame.

    Returns:
        pd.DataFrame with standardized columns:
            ['mmsi', 'vessel_name', 'flag', 'vessel_type',
             'flag_risk_weight', 'ais_gap_count', 'spoofing_incident_count']
    """
    if isinstance(source, pd.DataFrame):
        df = source.copy()
    else:
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"Vessel data file not found: {path}")
        df = pd.read_csv(path, comment="#")

    # Ensure MMSI is treated as string identifier
    df["mmsi"] = df["mmsi"].astype(str).str.strip()

    # Fill default values for missing attributes
    defaults = {
        "vessel_name": "UNKNOWN_VESSEL",
        "flag": "UNKNOWN_FLAG",
        "vessel_type": "UNKNOWN_TYPE",
        "flag_risk_weight": 0.0,
        "ais_gap_count": 0,
        "spoofing_incident_count": 0,
    }
    for col, default in defaults.items():
        if col not in df.columns:
            df[col] = default
        else:
            df[col] = df[col].fillna(default)

    return df


def load_interaction_data(source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
    """
    Load vessel interaction events into a cleaned Pandas DataFrame.

    Args:
        source: Filepath to CSV or an existing DataFrame.

    Returns:
        pd.DataFrame with standardized columns:
            ['source_mmsi', 'target_mmsi', 'interaction_type',
             'interaction_count', 'avg_duration_hours', 'interaction_risk', 'avg_distance_nm']
    """
    if isinstance(source, pd.DataFrame):
        df = source.copy()
    else:
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"Interaction data file not found: {path}")
        df = pd.read_csv(path, comment="#")

    # Convert MMSIs to string
    df["source_mmsi"] = df["source_mmsi"].astype(str).str.strip()
    df["target_mmsi"] = df["target_mmsi"].astype(str).str.strip()

    # Defaults for interaction metrics
    defaults = {
        "interaction_type": "GENERIC_INTERACTION",
        "interaction_count": 1,
        "avg_duration_hours": 1.0,
        "interaction_risk": 0.5,
        "avg_distance_nm": 0.5,
    }
    for col, default in defaults.items():
        if col not in df.columns:
            df[col] = default
        else:
            df[col] = df[col].fillna(default)

    return df


def build_vessel_graph(
    vessels_df: pd.DataFrame,
    interactions_df: pd.DataFrame,
    directed: bool = False,
    weight_metric: str = "interaction_risk",
) -> Union[nx.Graph, nx.DiGraph]:
    """
    Construct a NetworkX graph representation of vessel interactions.

    Nodes represent individual vessels.
    Edges represent observed or defined interactions (STS transfers, rendezvous, etc.).

    Args:
        vessels_df: DataFrame containing vessel node metadata.
        interactions_df: DataFrame containing pairwise vessel interactions.
        directed: Whether to construct a DiGraph (default: False, undirected).
        weight_metric: Column name to assign as primary edge 'weight' (default: 'interaction_risk').

    Returns:
        nx.Graph or nx.DiGraph with node and edge attributes attached.
    """
    G = nx.DiGraph() if directed else nx.Graph()

    # 1. Add all vessels as nodes with metadata
    for _, row in vessels_df.iterrows():
        mmsi = str(row["mmsi"])
        node_attrs = {
            "mmsi": mmsi,
            "vessel_name": str(row.get("vessel_name", "UNKNOWN")),
            "flag": str(row.get("flag", "UNKNOWN")),
            "vessel_type": str(row.get("vessel_type", "UNKNOWN")),
            "flag_risk_weight": float(row.get("flag_risk_weight", 0.0)),
            "ais_gap_count": int(row.get("ais_gap_count", 0)),
            "spoofing_incident_count": int(row.get("spoofing_incident_count", 0)),
        }
        G.add_node(mmsi, **node_attrs)

    # 2. Add edges with interaction attributes
    for _, row in interactions_df.iterrows():
        u = str(row["source_mmsi"])
        v = str(row["target_mmsi"])

        if u == v:
            # Skip self-loops in vessel interaction graph
            continue

        # If a vessel appears in interactions but not in vessel metadata, add stub node
        for node in (u, v):
            if not G.has_node(node):
                G.add_node(
                    node,
                    mmsi=node,
                    vessel_name=f"UNREGISTERED_{node}",
                    flag="UNKNOWN",
                    vessel_type="UNKNOWN",
                    flag_risk_weight=0.5,
                    ais_gap_count=0,
                    spoofing_incident_count=0,
                )

        weight_val = float(row.get(weight_metric, 1.0))
        edge_attrs = {
            "interaction_type": str(row.get("interaction_type", "GENERIC_INTERACTION")),
            "interaction_count": int(row.get("interaction_count", 1)),
            "avg_duration_hours": float(row.get("avg_duration_hours", 1.0)),
            "interaction_risk": float(row.get("interaction_risk", 0.5)),
            "avg_distance_nm": float(row.get("avg_distance_nm", row.get("min_distance_nm", 0.5))),
            "min_distance_nm": float(row.get("min_distance_nm", row.get("avg_distance_nm", 0.5))),
            "first_encounter": str(row.get("first_encounter", "")),
            "last_encounter": str(row.get("last_encounter", "")),
            "supporting_evidence": str(row.get("supporting_evidence", "Operational bilateral encounter.")),
            "weight": weight_val,
        }

        # If edge already exists (e.g. multiple events), aggregate or update
        if G.has_edge(u, v):
            existing = G[u][v]
            existing["interaction_count"] += edge_attrs["interaction_count"]
            # Weighted average of interaction risk
            existing["interaction_risk"] = max(existing["interaction_risk"], edge_attrs["interaction_risk"])
            existing["weight"] = max(existing.get("weight", 0.0), edge_attrs["weight"])
        else:
            G.add_edge(u, v, **edge_attrs)

    return G


def get_graph_summary(G: Union[nx.Graph, nx.DiGraph]) -> Dict[str, Any]:
    """
    Generate basic topological summary metrics for the graph.

    Args:
        G: NetworkX graph.

    Returns:
        Dict containing node count, edge count, density, component count, and average degree.
    """
    num_nodes = G.number_of_nodes()
    num_edges = G.number_of_edges()

    if num_nodes == 0:
        return {
            "num_nodes": 0,
            "num_edges": 0,
            "density": 0.0,
            "is_connected": False,
            "num_connected_components": 0,
            "average_degree": 0.0,
        }

    density = nx.density(G)
    is_directed = G.is_directed()

    if is_directed:
        num_components = nx.number_weakly_connected_components(G)
        is_conn = nx.is_weakly_connected(G)
    else:
        num_components = nx.number_connected_components(G)
        is_conn = nx.is_connected(G)

    degrees = [d for _, d in G.degree()]
    avg_degree = sum(degrees) / num_nodes if num_nodes > 0 else 0.0

    return {
        "num_nodes": num_nodes,
        "num_edges": num_edges,
        "density": round(density, 4),
        "is_connected": is_conn,
        "num_connected_components": num_components,
        "average_degree": round(avg_degree, 3),
        "is_directed": is_directed,
    }


def add_or_update_vessel(G: Union[nx.Graph, nx.DiGraph], mmsi: str, **attrs) -> None:
    """
    Dynamically add or update an individual vessel node attributes in graph G.
    Preserves existing attributes if not overridden.
    """
    node = str(mmsi).strip()
    if G.has_node(node):
        G.nodes[node].update(attrs)
    else:
        default_attrs = {
            "mmsi": node,
            "vessel_name": attrs.get("vessel_name", f"Vessel_{node}"),
            "flag": attrs.get("flag", "UNKNOWN"),
            "vessel_type": attrs.get("vessel_type", "UNKNOWN"),
            "flag_risk_weight": attrs.get("flag_risk_weight", 0.0),
            "ais_gap_count": attrs.get("ais_gap_count", 0),
            "spoofing_incident_count": attrs.get("spoofing_incident_count", 0),
        }
        default_attrs.update(attrs)
        G.add_node(node, **default_attrs)


def record_interaction_event(
    G: Union[nx.Graph, nx.DiGraph],
    source_mmsi: str,
    target_mmsi: str,
    interaction_type: str = "POTENTIAL_STS_ENCOUNTER",
    duration_hours: float = 1.0,
    distance_nm: float = 0.5,
    risk: float = 0.5,
    timestamp: Optional[str] = None,
    evidence: Optional[str] = None,
) -> None:
    """
    Dynamically add or aggregate a new interaction event between two vessels.
    Prevents self-loops, stubs missing nodes, and updates interaction metrics incrementally.
    """
    u = str(source_mmsi).strip()
    v = str(target_mmsi).strip()
    if u == v:
        return

    for node in (u, v):
        if not G.has_node(node):
            add_or_update_vessel(G, node)

    if G.has_edge(u, v):
        edge = G[u][v]
        edge["interaction_count"] = edge.get("interaction_count", 1) + 1
        edge["avg_duration_hours"] = round((edge.get("avg_duration_hours", duration_hours) + duration_hours) / 2.0, 2)
        edge["min_distance_nm"] = min(edge.get("min_distance_nm", distance_nm), distance_nm)
        edge["interaction_risk"] = max(edge.get("interaction_risk", risk), risk)
        edge["weight"] = max(edge.get("weight", risk), risk)
        if timestamp:
            edge["last_encounter"] = timestamp
        if evidence:
            edge["supporting_evidence"] = evidence
    else:
        G.add_edge(
            u,
            v,
            interaction_type=interaction_type,
            interaction_count=1,
            avg_duration_hours=float(duration_hours),
            min_distance_nm=float(distance_nm),
            interaction_risk=float(risk),
            weight=float(risk),
            first_encounter=timestamp or "",
            last_encounter=timestamp or "",
            supporting_evidence=evidence or f"Observed proximity of {distance_nm} nm for {duration_hours}h.",
        )


def build_vessel_multigraph(
    vessels_df: pd.DataFrame,
    encounters_df: pd.DataFrame,
) -> nx.MultiGraph:
    """
    Construct a MultiGraph representation preserving separate historical encounter events.
    """
    MG = nx.MultiGraph()

    for _, row in vessels_df.iterrows():
        mmsi = str(row["mmsi"])
        MG.add_node(mmsi, **row.to_dict())

    for idx, row in encounters_df.iterrows():
        u = str(row["source_mmsi"])
        v = str(row["target_mmsi"])
        if u == v:
            continue
        for node in (u, v):
            if not MG.has_node(node):
                MG.add_node(node, mmsi=node, vessel_name=f"Vessel_{node}")

        edge_attrs = row.to_dict()
        edge_attrs["key"] = f"event_{idx}_{u}_{v}"
        MG.add_edge(u, v, **edge_attrs)

    return MG


def filter_graph_by_date_range(
    G: Union[nx.Graph, nx.DiGraph, nx.MultiGraph],
    start_time: str,
    end_time: str,
) -> Union[nx.Graph, nx.DiGraph]:
    """
    Generate a temporal subgraph view filtered to edges occurring within [start_time, end_time].
    Does NOT modify the underlying historical master graph.
    """
    sub_G = G.__class__()
    for node, attrs in G.nodes(data=True):
        sub_G.add_node(node, **attrs)

    for u, v, data in G.edges(data=True):
        ts = data.get("first_encounter") or data.get("last_encounter") or data.get("encounter_timestamp")
        if not ts:
            sub_G.add_edge(u, v, **data)
            continue
        if start_time <= ts <= end_time:
            sub_G.add_edge(u, v, **data)

    return sub_G


def export_graph_to_cytoscape(
    G: Union[nx.Graph, nx.DiGraph],
    risk_df: Optional[pd.DataFrame] = None,
    community_map: Optional[Dict[str, int]] = None,
    is_demo: bool = False,
) -> Dict[str, Any]:
    """
    Serialize NetworkX graph to Cytoscape.js format matching React frontend expectations:
    { "elements": [ { "data": { "id", "label", "riskScore", "riskCategory", ... } } ], "summary": { ... } }
    """
    elements: List[Dict[str, Any]] = []

    risk_map: Dict[str, Dict[str, Any]] = {}
    if risk_df is not None and not risk_df.empty:
        for _, row in risk_df.iterrows():
            m = str(row["mmsi"])
            risk_map[m] = {
                "riskScore": float(row.get("composite_risk_score", 0.1)),
                "riskTier": str(row.get("risk_tier", "BASELINE_LEGITIMATE")),
                "primaryDriver": str(row.get("primary_risk_driver", "Baseline")),
            }

    # 1. Nodes
    for node, attrs in G.nodes(data=True):
        mmsi = str(node)
        r_info = risk_map.get(mmsi, {})
        score = r_info.get("riskScore", float(attrs.get("risk_score", 0.1)))
        tier = r_info.get("riskTier", attrs.get("risk_tier", "BASELINE_LEGITIMATE"))

        # Map to 5 standard frontend categories
        if tier == "CRITICAL_MONITORING" or score >= 0.65:
            cat, sym, col = "CRITICAL", "!", "#FF5C65"
        elif tier == "ELEVATED_ATTENTION" or score >= 0.45:
            cat, sym, col = "HIGH", "▲", "#FF9900"
        elif tier == "MODERATE_INTERACTION" or score >= 0.25:
            cat, sym, col = "MEDIUM", "●", "#F5B942"
        else:
            cat, sym, col = "LOW", "✓", "#39D98A"

        v_name = str(attrs.get("vessel_name", f"Vessel_{mmsi}"))
        elements.append({
            "data": {
                "id": mmsi,
                "label": v_name.replace("MOCK_", ""),
                "fullName": v_name,
                "flag": str(attrs.get("flag", "UNKNOWN")),
                "vesselType": str(attrs.get("vessel_type", attrs.get("vessel_type_name", "Unknown"))),
                "riskScore": round(score, 4),
                "riskTier": tier,
                "riskCategory": cat,
                "riskSymbol": sym,
                "riskColor": col,
                "primaryDriver": r_info.get("primaryDriver", "Normal navigation"),
                "betweenness": round(float(attrs.get("betweenness_centrality", 0.0)), 4),
                "degree": round(float(attrs.get("degree_centrality", 0.0)), 4),
                "closeness": round(float(attrs.get("closeness_centrality", 0.0)), 4),
                "aisGaps": int(attrs.get("ais_gap_count", 0)),
                "spoofingCount": int(attrs.get("spoofing_incident_count", 0)),
                "community": community_map.get(mmsi, int(attrs.get("community_id", 1))) if community_map else 1,
                "isDemo": is_demo,
            }
        })

    # 2. Edges
    edge_idx = 0
    for u, v, data in G.edges(data=True):
        edge_idx += 1
        edge_id = f"edge-{u}-{v}-{edge_idx}"
        i_type = str(data.get("interaction_type", "GENERIC_INTERACTION"))
        elements.append({
            "data": {
                "id": edge_id,
                "source": str(u),
                "target": str(v),
                "interactionType": i_type,
                "label": i_type.replace("_", " "),
                "count": int(data.get("interaction_count", 1)),
                "duration": float(data.get("avg_duration_hours", 1.0)),
                "risk": float(data.get("interaction_risk", data.get("weight", 0.5))),
                "distance": float(data.get("min_distance_nm", data.get("avg_distance_nm", 0.5))),
                "isVerified": True,
                "evidence": str(data.get("supporting_evidence", "Operational bilateral encounter.")),
                "timestamps": {
                    "firstSeen": str(data.get("first_encounter", "2026-01-01")),
                    "lastSeen": str(data.get("last_encounter", "2026-01-31")),
                },
                "sourceInfo": "NOAA AIS Vessel Tracks Ingestion",
                "isDemo": is_demo,
            }
        })

    return {
        "elements": elements,
        "summary": get_graph_summary(G),
    }

