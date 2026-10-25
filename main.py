"""
Main Demonstration Runner for Member 3's Shadow Fleet SNA & ACO Module.

Executes the complete pipeline:
1. Load synthetic vessel and interaction data
2. Construct NetworkX graph
3. Compute SNA metrics (Degree, Betweenness, Components)
4. Calculate Composite Network Risk Scores
5. Run Ant Colony Optimization (ACO) path search
6. Optionally render and save a graph visualization plot

DISCLAIMER: All data used here is synthetic illustrative mock data.
ACO is an exploratory path search heuristic, not proof of shadow fleet membership.
"""

from pathlib import Path
import sys
import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for plotting
import matplotlib.pyplot as plt
import networkx as nx

# Add current folder to path if executed standalone
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


def print_section(title: str) -> None:
    print("\n" + "=" * 78)
    print(f" {title.upper()}")
    print("=" * 78)


def generate_graph_plot(G: nx.Graph, risk_df, aco_path, output_path: Path) -> None:
    """Generate and save a clear network visualization with highlighted ACO path."""
    plt.figure(figsize=(11, 8))
    pos = nx.spring_layout(G, seed=42, k=0.85)

    # Risk score mapping to node colors
    risk_map = dict(zip(risk_df["mmsi"], risk_df["composite_risk_score"]))
    node_colors = [risk_map.get(n, 0.2) for n in G.nodes()]

    # Draw all edges
    nx.draw_networkx_edges(G, pos, alpha=0.35, edge_color="gray", width=1.5)

    # Highlight ACO best path edges if available
    if aco_path and len(aco_path) > 1:
        path_edges = list(zip(aco_path[:-1], aco_path[1:]))
        nx.draw_networkx_edges(
            G, pos, edgelist=path_edges, edge_color="#e63946", width=3.5, style="solid",
            label="Optimal ACO Pathway"
        )

    # Draw nodes
    nodes = nx.draw_networkx_nodes(
        G, pos, node_color=node_colors, cmap=plt.cm.YlOrRd, node_size=750, alpha=0.9
    )

    # Labels: vessel name
    name_map = dict(zip(risk_df["mmsi"], risk_df["vessel_name"]))
    short_labels = {n: name_map.get(n, n).replace("MOCK_", "") for n in G.nodes()}
    nx.draw_networkx_labels(G, pos, labels=short_labels, font_size=8, font_weight="bold")

    plt.colorbar(nodes, label="Composite Network Risk Score (0.0 - 1.0)", shrink=0.8)
    plt.title(
        "Vessel Interaction Graph (SNA & ACO Path Highlighting)\n[Synthetic Demonstration Data]",
        fontsize=12, pad=15, fontweight="bold"
    )
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    print(f"Saved network visualization plot to: {output_path.name}")


def main() -> None:
    print_section("Shadow Fleet Detection - SNA & ACO Module (Member 3)")
    print("DISCLAIMER: All vessels, MMSIs, and rendezvous data are synthetic mock records.")
    print("ACO objective: Exploratory path-prioritization for human analyst triage.\n")

    base_dir = current_dir
    data_dir = base_dir / "data"
    vessels_csv = data_dir / "sample_vessels.csv"
    interactions_csv = data_dir / "sample_interactions.csv"

    # Step 1: Load Data
    print(f"[*] Ingesting vessel metadata from: {vessels_csv.name}")
    vessels_df = load_vessel_data(vessels_csv)
    print(f"[*] Ingesting interaction events from: {interactions_csv.name}")
    interactions_df = load_interaction_data(interactions_csv)

    # Step 2: Build Graph
    print_section("Step 1: Graph Construction & Topological Summary")
    G = build_vessel_graph(vessels_df, interactions_df, directed=False)
    summary = get_graph_summary(G)
    for k, v in summary.items():
        print(f"  - {k:<28}: {v}")

    # Step 3: Compute SNA Centrality Metrics
    print_section("Step 2: Social Network Analysis (SNA) Centrality Metrics")
    sna_df = compute_sna_metrics(G)
    components = extract_connected_components(G)
    print(f"Identified {len(components)} connected components.")
    for comp in components:
        print(f"  * Component {comp['component_id']}: {comp['size']} vessels | Density: {comp['density']} | Vessels: {comp['vessels']}")

    print("\nTop 3 Bridge Vessels by Betweenness Centrality (Crucial Intermediaries):")
    top_bridges = get_top_influential_vessels(sna_df, "betweenness_centrality", top_n=3)
    print(top_bridges[["mmsi", "vessel_name", "flag", "betweenness_centrality", "degree_centrality"]].to_string(index=False))

    # Step 4: Risk Scoring
    print_section("Step 3: Composite Network Risk Scoring")
    risk_df = compute_composite_risk_scores(sna_df)
    display_cols = [
        "mmsi", "vessel_name", "flag", "composite_risk_score",
        "risk_tier", "primary_risk_driver"
    ]
    print(risk_df[display_cols].to_string(index=False))

    # Step 5: ACO Optimizer
    print_section("Step 4: Ant Colony Optimization (ACO) Graph Path Search")
    source_mmsi = "999000001"       # MOCK_NEPTUNE_FEEDER
    destination_mmsi = "999000010"  # MOCK_HORIZON_DEST

    print(f"Objective: Discover optimal multi-hop covert transfer pathway")
    print(f"Source Vessel     : {source_mmsi} (MOCK_NEPTUNE_FEEDER)")
    print(f"Destination Vessel: {destination_mmsi} (MOCK_HORIZON_DEST)")

    aco = AntColonyPathOptimizer(
        G,
        num_ants=20,
        num_iterations=25,
        alpha=1.0,
        beta=2.5,
        evaporation_rate=0.2,
        seed=42,
    )
    result = aco.find_optimal_path(source_mmsi, destination_mmsi)

    print("\nACO Execution Results:")
    print(f"  - Found Valid Path   : {result.found_valid_path}")
    print(f"  - Total Hops         : {result.total_hops}")
    print(f"  - Cumulative Risk    : {result.cumulative_risk:.4f}")
    print(f"  - Path Fitness Score : {result.path_fitness:.4f}")
    print(f"  - Optimal Route (MMSI)  : {' -> '.join(result.best_path)}")
    print(f"  - Optimal Route (Names) : {' -> '.join(result.best_path_vessel_names)}")
    print(f"\n  [SAFETY NOTICE]: {result.disclaimer}")

    # Step 6: Render Plot
    print_section("Step 5: Visualization Export")
    plot_path = base_dir / "network_visualization.png"
    generate_graph_plot(G, risk_df, result.best_path, plot_path)

    print_section("Pipeline Run Completed Successfully")


if __name__ == "__main__":
    main()
