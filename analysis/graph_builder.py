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
            "avg_distance_nm": float(row.get("avg_distance_nm", 0.5)),
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
