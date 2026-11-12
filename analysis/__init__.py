"""
Shadow Fleet Social Network Analysis (SNA), Real AIS Ingestion, and Ant Colony Optimization (ACO) Module.

Components:
- ais_ingestion: Ingestion and parsing of NOAA MarineCadastre AIS vessel-tracks GeoPackage.
- ais_anomaly_detection: Detection of AIS observation gaps, loitering, position jumps, and STS encounters.
- graph_builder: Constructs NetworkX vessel graphs with dynamic updates and Cytoscape serialization.
- sna_metrics: Calculates centralities, communities, traversal, and behavioral similarity matrices.
- risk_scoring: Computes explainable composite network risk scores.
- alert_engine: Manages surveillance alerts, deduplication, and investigation review lifecycle.
- aco_optimizer: Ant Colony Optimization for network path search.
"""

from .graph_builder import (
    load_vessel_data,
    load_interaction_data,
    build_vessel_graph,
    get_graph_summary,
    add_or_update_vessel,
    record_interaction_event,
    build_vessel_multigraph,
    filter_graph_by_date_range,
    export_graph_to_cytoscape,
)
from .sna_metrics import (
    compute_sna_metrics,
    extract_connected_components,
    get_top_influential_vessels,
    detect_communities,
    compute_vessel_similarity_matrix,
    get_bfs_traversal,
    get_dfs_traversal,
    get_nhop_neighborhood,
)
from .risk_scoring import (
    compute_composite_risk_scores,
    categorize_risk_tiers,
    explain_vessel_risk,
)
from .aco_optimizer import (
    AntColonyPathOptimizer,
    ACOResult,
)
from .ais_ingestion import (
    AISIngestionPipeline,
    get_flag_from_mmsi,
    haversine_nm,
)
from .ais_anomaly_detection import (
    detect_ais_observation_gaps,
    detect_idle_periods,
    detect_position_discontinuities,
    detect_vessel_encounters,
    compute_vessel_anomaly_profiles,
)
from .alert_engine import AlertEngine

__all__ = [
    "load_vessel_data",
    "load_interaction_data",
    "build_vessel_graph",
    "get_graph_summary",
    "add_or_update_vessel",
    "record_interaction_event",
    "build_vessel_multigraph",
    "filter_graph_by_date_range",
    "export_graph_to_cytoscape",
    "compute_sna_metrics",
    "extract_connected_components",
    "get_top_influential_vessels",
    "detect_communities",
    "compute_vessel_similarity_matrix",
    "get_bfs_traversal",
    "get_dfs_traversal",
    "get_nhop_neighborhood",
    "compute_composite_risk_scores",
    "categorize_risk_tiers",
    "explain_vessel_risk",
    "AntColonyPathOptimizer",
    "ACOResult",
    "AISIngestionPipeline",
    "get_flag_from_mmsi",
    "haversine_nm",
    "detect_ais_observation_gaps",
    "detect_idle_periods",
    "detect_position_discontinuities",
    "detect_vessel_encounters",
    "compute_vessel_anomaly_profiles",
    "AlertEngine",
]
