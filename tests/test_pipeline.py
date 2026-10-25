"""End-to-end integration tests using the sample dataset."""

import unittest
from pathlib import Path

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


class TestPipelineIntegration(unittest.TestCase):
    """Integration test suite executing the entire analytical workflow."""

    @classmethod
    def setUpClass(cls):
        """Locate sample data files."""
        base_dir = Path(__file__).resolve().parent.parent
        cls.vessels_file = base_dir / "data" / "sample_vessels.csv"
        cls.interactions_file = base_dir / "data" / "sample_interactions.csv"

    def test_end_to_end_pipeline(self):
        """Execute full workflow: Ingestion -> Graph -> SNA -> Risk -> ACO."""
        # 1. Load data
        vessels_df = load_vessel_data(self.vessels_file)
        interactions_df = load_interaction_data(self.interactions_file)
        self.assertEqual(len(vessels_df), 12)
        self.assertEqual(len(interactions_df), 12)

        # 2. Build graph
        G = build_vessel_graph(vessels_df, interactions_df, directed=False)
        summary = get_graph_summary(G)
        self.assertEqual(summary["num_nodes"], 12)
        self.assertEqual(summary["num_edges"], 12)
        self.assertEqual(summary["num_connected_components"], 2)

        # 3. Compute SNA metrics
        sna_df = compute_sna_metrics(G)
        self.assertEqual(len(sna_df), 12)
        self.assertIn("betweenness_centrality", sna_df.columns)
        self.assertIn("degree_centrality", sna_df.columns)

        components = extract_connected_components(G)
        self.assertEqual(len(components), 2)
        self.assertEqual(components[0]["size"], 10)  # Main cluster
        self.assertEqual(components[1]["size"], 2)   # Isolated cluster

        top_bridges = get_top_influential_vessels(sna_df, "betweenness_centrality", top_n=3)
        self.assertEqual(len(top_bridges), 3)

        # 4. Compute risk scores
        risk_df = compute_composite_risk_scores(sna_df)
        self.assertEqual(len(risk_df), 12)
        self.assertIn("composite_risk_score", risk_df.columns)
        self.assertIn("risk_tier", risk_df.columns)

        # Verify scores are sorted descending
        scores = risk_df["composite_risk_score"].tolist()
        self.assertEqual(scores, sorted(scores, reverse=True))

        # 5. Run ACO pathfinder between suspect feeder and destination
        source_mmsi = "999000001"       # MOCK_NEPTUNE_FEEDER
        destination_mmsi = "999000010"  # MOCK_HORIZON_DEST

        optimizer = AntColonyPathOptimizer(
            G,
            num_ants=15,
            num_iterations=20,
            seed=42,
        )
        aco_result = optimizer.find_optimal_path(source_mmsi, destination_mmsi)

        self.assertTrue(aco_result.found_valid_path)
        self.assertEqual(aco_result.best_path[0], source_mmsi)
        self.assertEqual(aco_result.best_path[-1], destination_mmsi)
        self.assertGreater(aco_result.total_hops, 1)
        self.assertGreater(aco_result.cumulative_risk, 0.0)


if __name__ == "__main__":
    unittest.main()
