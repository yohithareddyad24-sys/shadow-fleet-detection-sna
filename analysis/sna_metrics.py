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

from typing import Dict, Any, List, Union, Optional
import networkx as nx
import pandas as pd
import numpy as np


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


def detect_communities(G: Union[nx.Graph, nx.DiGraph]) -> Dict[str, Any]:
    """
    Detect modular network communities using Louvain algorithm or greedy modularity.

    Returns:
        Dict with 'communities' list and 'node_to_community' mapping dictionary.
    """
    if G.number_of_nodes() == 0:
        return {"total_communities": 0, "communities": [], "node_to_community": {}}

    # Convert DiGraph to undirected copy for community partitioning if needed
    uG = G.to_undirected() if G.is_directed() else G

    try:
        # Louvain community detection (NetworkX 3+)
        raw_comms = nx.community.louvain_communities(uG, seed=42)
    except Exception:
        # Fallback to Clauset-Newman-Moore greedy modularity
        try:
            raw_comms = list(nx.community.greedy_modularity_communities(uG))
        except Exception:
            # Component fallback
            raw_comms = list(nx.connected_components(uG))

    # Sort largest community first
    sorted_comms = sorted(raw_comms, key=len, reverse=True)

    node_to_comm: Dict[str, int] = {}
    comm_list: List[Dict[str, Any]] = []

    for cid, members in enumerate(sorted_comms, start=1):
        member_list = sorted([str(m) for m in members])
        for node in member_list:
            node_to_comm[node] = cid

        sub = uG.subgraph(members)
        dens = round(nx.density(sub), 4) if len(members) > 1 else 1.0

        comm_list.append({
            "community_id": cid,
            "vessel_count": len(members),
            "mmsis": member_list,
            "density": dens,
            "label": f"Cluster {cid}",
        })

    return {
        "total_communities": len(comm_list),
        "communities": comm_list,
        "node_to_community": node_to_comm,
    }


def compute_vessel_similarity_matrix(
    vessels_df: pd.DataFrame,
    features: Optional[List[str]] = None,
    top_n: int = 50,
) -> Dict[str, Any]:
    """
    Computes a behavioral similarity matrix across vessels based on normalized
    kinematic, observational, and network features.

    Inputs:
        vessels_df: DataFrame containing vessel records and metric columns.
        features: Optional list of numeric feature columns.
        top_n: Max vessels to include in dense pairwise matrix to avoid excessive payload.

    Returns:
        JSON-ready dict with vessel_ids, similarity matrix, top paired relationships,
        and feature importance breakdowns.
    """
    if vessels_df.empty:
        return {"vessel_ids": [], "matrix": [], "pairs": [], "features_used": []}

    df = vessels_df.copy()
    if len(df) > top_n:
        # Prioritize vessels with higher activity/anomalies for the matrix
        sort_col = "betweenness_centrality" if "betweenness_centrality" in df.columns else df.columns[0]
        df = df.sort_values(by=sort_col, ascending=False).head(top_n).reset_index(drop=True)

    candidate_features = [
        "degree_centrality",
        "betweenness_centrality",
        "closeness_centrality",
        "clustering_coefficient",
        "ais_gap_count",
        "idle_period_count",
        "spoofing_incident_count",
        "encounter_count",
        "track_count",
        "avg_duration_minutes",
        "avg_speed_kn",
        "flag_risk_weight",
    ]

    selected_features = [f for f in candidate_features if f in df.columns]
    if not selected_features:
        # Fall back to any numeric columns
        selected_features = [c for c in df.select_dtypes(include=[np.number]).columns if c != "mmsi"]

    if not selected_features:
        return {"vessel_ids": list(df["mmsi"].astype(str)), "matrix": [], "pairs": [], "features_used": []}

    # Extract numeric matrix and impute NaNs
    feat_matrix = df[selected_features].fillna(0.0).to_numpy(dtype=float)

    # Min-Max Normalization column-wise
    min_vals = feat_matrix.min(axis=0)
    max_vals = feat_matrix.max(axis=0)
    range_vals = np.where(max_vals - min_vals == 0, 1.0, max_vals - min_vals)
    norm_matrix = (feat_matrix - min_vals) / range_vals

    # Cosine Similarity Calculation: S = A . B / (||A|| * ||B||)
    norms = np.linalg.norm(norm_matrix, axis=1, keepdims=True)
    norms[norms == 0.0] = 1.0
    normalized_vecs = norm_matrix / norms
    sim_matrix = np.dot(normalized_vecs, normalized_vecs.T)
    sim_matrix = np.clip(sim_matrix, 0.0, 1.0)

    vessel_ids = [str(m) for m in df["mmsi"]]
    vessel_names = {str(r["mmsi"]): str(r.get("vessel_name", r["mmsi"])) for _, r in df.iterrows()}

    # Extract top pairwise similar vessels (excluding self-pairs)
    pairs = []
    n = len(vessel_ids)
    for i in range(n):
        for j in range(i + 1, n):
            score = round(float(sim_matrix[i, j]), 4)
            # Find top shared features for explainability
            shared_traits = []
            for f_idx, feat_name in enumerate(selected_features):
                v1_val = norm_matrix[i, f_idx]
                v2_val = norm_matrix[j, f_idx]
                diff = abs(v1_val - v2_val)
                if diff <= 0.20 and (v1_val > 0.1 or v2_val > 0.1):
                    shared_traits.append(feat_name.replace("_", " "))

            pairs.append({
                "vessel_a": vessel_ids[i],
                "vessel_b": vessel_ids[j],
                "name_a": vessel_names.get(vessel_ids[i], vessel_ids[i]),
                "name_b": vessel_names.get(vessel_ids[j], vessel_ids[j]),
                "similarity": score,
                "shared_traits": shared_traits[:3] if shared_traits else ["Baseline activity profile"],
            })

    pairs.sort(key=lambda x: x["similarity"], reverse=True)

    return {
        "vessel_ids": vessel_ids,
        "vessel_names": vessel_names,
        "features_used": selected_features,
        "matrix": [[round(float(val), 3) for val in row] for row in sim_matrix],
        "top_pairs": pairs[:25],
        "disclaimer": "Behavioral similarity reflects mathematical vector alignment, not evidence of coordination.",
    }


def get_bfs_traversal(
    G: Union[nx.Graph, nx.DiGraph],
    start_node: str,
    max_depth: int = 3,
) -> Dict[str, Any]:
    """
    Breadth-First Search traversal with edge sequence, hop distances, and depth cutoff.
    """
    start = str(start_node)
    if not G.has_node(start):
        return {"visited_order": [], "edge_sequence": [], "distances": {}, "start_node": start}

    visited = {start}
    queue = [(start, 0)]
    visited_order = [start]
    edge_sequence = []
    distances = {start: 0}

    while queue:
        curr, d = queue.pop(0)
        if d >= max_depth:
            continue

        neighbors = sorted(list(G.neighbors(curr)))
        for neighbor in neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                visited_order.append(neighbor)
                edge_sequence.append({
                    "from": curr,
                    "to": neighbor,
                    "hop": d + 1,
                    "edge_data": G.get_edge_data(curr, neighbor, default={}),
                })
                distances[neighbor] = d + 1
                queue.append((neighbor, d + 1))

    return {
        "start_node": start,
        "algorithm": "BFS",
        "max_depth": max_depth,
        "visited_order": visited_order,
        "edge_sequence": edge_sequence,
        "distances": distances,
        "total_visited": len(visited_order),
    }


def get_dfs_traversal(
    G: Union[nx.Graph, nx.DiGraph],
    start_node: str,
    max_depth: int = 3,
) -> Dict[str, Any]:
    """
    Depth-First Search traversal with edge sequence, hop distances, and depth cutoff.
    """
    start = str(start_node)
    if not G.has_node(start):
        return {"visited_order": [], "edge_sequence": [], "distances": {}, "start_node": start}

    visited = {start}
    visited_order = [start]
    edge_sequence = []
    distances = {start: 0}

    def _dfs(curr, d):
        if d >= max_depth:
            return
        neighbors = sorted(list(G.neighbors(curr)))
        for neighbor in neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                visited_order.append(neighbor)
                edge_sequence.append({
                    "from": curr,
                    "to": neighbor,
                    "hop": d + 1,
                    "edge_data": G.get_edge_data(curr, neighbor, default={}),
                })
                distances[neighbor] = d + 1
                _dfs(neighbor, d + 1)

    _dfs(start, 0)

    return {
        "start_node": start,
        "algorithm": "DFS",
        "max_depth": max_depth,
        "visited_order": visited_order,
        "edge_sequence": edge_sequence,
        "distances": distances,
        "total_visited": len(visited_order),
    }


def get_nhop_neighborhood(
    G: Union[nx.Graph, nx.DiGraph],
    start_node: str,
    hops: int = 2,
) -> Dict[str, Any]:
    """
    Extracts the ego subgraph containing all nodes and edges within `hops` distance.
    """
    start = str(start_node)
    if not G.has_node(start):
        return {"nodes": [], "edges": [], "subgraph_summary": {}}

    lengths = nx.single_source_shortest_path_length(G, start, cutoff=hops)
    subgraph_nodes = list(lengths.keys())
    sub = G.subgraph(subgraph_nodes)

    nodes = []
    for n in sub.nodes():
        nodes.append({
            "id": n,
            "hop_distance": lengths.get(n, 0),
            **sub.nodes[n],
        })

    edges = []
    for u, v, data in sub.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            **data,
        })

    return {
        "root_mmsi": start,
        "hops": hops,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges,
    }

