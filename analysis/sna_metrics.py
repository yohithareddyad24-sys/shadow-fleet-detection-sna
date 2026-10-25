"""
Social Network Analysis (SNA) Metrics Engine.

Computes topological metrics on vessel interaction graphs:
- Degree Centrality (direct rendezvous frequency / connection volume)
- Betweenness Centrality (intermediary / bridge role in multi-hop chains)
- Closeness Centrality (proximity to all other nodes in the network)
- Connected Components (isolated subgraphs / clusters of rendezvous)
- Clustering Coefficient (triadic closure / local clique formation)

DISCLAIMER: Metric computations are purely mathematical graph analyses on synthetic data.
High centrality does not prove malicious intent or shadow fleet participation.
"""

from typing import Dict, Any, List, Union
import networkx as nx
import pandas as pd


def compute_sna_metrics(
    G: Union[nx.Graph, nx.DiGraph],
    weight_attribute: str = "weight",
) -> pd.DataFrame:
    """
    Calculate comprehensive Social Network Analysis (SNA) metrics for all nodes in the graph.

    Args:
        G: NetworkX Graph or DiGraph.
        weight_attribute: Edge attribute name to use if weighting is applicable.

    Returns:
        pd.DataFrame containing node attributes and computed centralities,
        indexed by vessel MMSI.
    """
    if G.number_of_nodes() == 0:
        return pd.DataFrame()

    is_directed = G.is_directed()

    # 1. Degree Centrality
    degree_centrality = nx.degree_centrality(G)
    raw_degree = dict(G.degree())

    # 2. In/Out Degree if directed
    if is_directed:
        in_degree_centrality = nx.in_degree_centrality(G)
        out_degree_centrality = nx.out_degree_centrality(G)
    else:
        in_degree_centrality = degree_centrality
        out_degree_centrality = degree_centrality

    # 3. Betweenness Centrality
    # For betweenness, higher weight usually means stronger connection (lower distance).
    # We invert weight to create distance for shortest path betweenness if weight > 0.
    G_dist = G.copy()
    for _, _, data in G_dist.edges(data=True):
        w = data.get(weight_attribute, 1.0)
        data["distance"] = 1.0 / max(w, 0.001)

    betweenness_centrality = nx.betweenness_centrality(G_dist, weight="distance", normalized=True)

    # 4. Closeness Centrality
    closeness_centrality = nx.closeness_centrality(G_dist, distance="distance")

    # 5. Clustering Coefficient (for undirected, or converted undirected copy)
    if is_directed:
        clustering_coeff = nx.clustering(G.to_undirected())
    else:
        clustering_coeff = nx.clustering(G)

    # 6. Connected Component Labeling
    component_map: Dict[str, int] = {}
    if is_directed:
        components = list(nx.weakly_connected_components(G))
    else:
        components = list(nx.connected_components(G))

    # Sort components by size descending
    components.sort(key=len, reverse=True)
    for comp_id, comp_nodes in enumerate(components, start=1):
        for node in comp_nodes:
            component_map[node] = comp_id

    # 7. Aggregate records
    records = []
    for node, attrs in G.nodes(data=True):
        record = {
            "mmsi": str(node),
            "vessel_name": attrs.get("vessel_name", "UNKNOWN"),
            "flag": attrs.get("flag", "UNKNOWN"),
            "vessel_type": attrs.get("vessel_type", "UNKNOWN"),
            "flag_risk_weight": attrs.get("flag_risk_weight", 0.0),
            "ais_gap_count": attrs.get("ais_gap_count", 0),
            "spoofing_incident_count": attrs.get("spoofing_incident_count", 0),
            "raw_degree": raw_degree.get(node, 0),
            "degree_centrality": round(degree_centrality.get(node, 0.0), 4),
            "betweenness_centrality": round(betweenness_centrality.get(node, 0.0), 4),
            "closeness_centrality": round(closeness_centrality.get(node, 0.0), 4),
            "clustering_coefficient": round(clustering_coeff.get(node, 0.0), 4),
            "component_id": component_map.get(node, 0),
        }

        if is_directed:
            record["in_degree_centrality"] = round(in_degree_centrality.get(node, 0.0), 4)
            record["out_degree_centrality"] = round(out_degree_centrality.get(node, 0.0), 4)

        records.append(record)

    df_metrics = pd.DataFrame(records)
    # Sort primarily by betweenness centrality descending
    df_metrics.sort_values(by=["betweenness_centrality", "degree_centrality"], ascending=False, inplace=True)
    df_metrics.reset_index(drop=True, inplace=True)
    return df_metrics


def extract_connected_components(
    G: Union[nx.Graph, nx.DiGraph]
) -> List[Dict[str, Any]]:
    """
    Extract all connected components and their topological profiles.

    Args:
        G: NetworkX Graph or DiGraph.

    Returns:
        List of dictionaries with component details:
            - 'component_id': integer identifier
            - 'size': number of vessels
            - 'vessels': list of MMSI identifiers
            - 'density': internal subgraph density
    """
    if G.is_directed():
        raw_components = list(nx.weakly_connected_components(G))
    else:
        raw_components = list(nx.connected_components(G))

    # Sort largest component first
    raw_components.sort(key=len, reverse=True)

    result = []
    for idx, comp_nodes in enumerate(raw_components, start=1):
        subgraph = G.subgraph(comp_nodes)
        density = nx.density(subgraph) if len(comp_nodes) > 1 else 0.0
        result.append({
            "component_id": idx,
            "size": len(comp_nodes),
            "vessels": sorted(list(comp_nodes)),
            "density": round(density, 4),
        })

    return result


def get_top_influential_vessels(
    metrics_df: pd.DataFrame,
    metric: str = "betweenness_centrality",
    top_n: int = 5,
) -> pd.DataFrame:
    """
    Retrieve the top-N influential vessels by a specified centrality metric.

    Args:
        metrics_df: DataFrame generated by compute_sna_metrics.
        metric: Column to sort by (e.g. 'betweenness_centrality' or 'degree_centrality').
        top_n: Number of records to return.

    Returns:
        Subset DataFrame of top-N vessels.
    """
    if metrics_df.empty or metric not in metrics_df.columns:
        return pd.DataFrame()

    return metrics_df.sort_values(by=metric, ascending=False).head(top_n).copy()


def export_metrics_to_dict(metrics_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Convert metrics DataFrame to a JSON-serializable list of dicts for API consumption.

    Args:
        metrics_df: DataFrame of SNA metrics.

    Returns:
        List of dictionaries representing vessel metrics.
    """
    if metrics_df.empty:
        return []
    return metrics_df.to_dict(orient="records")
