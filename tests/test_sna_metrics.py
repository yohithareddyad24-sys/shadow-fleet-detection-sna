"""Unit tests for analysis/sna_metrics.py."""

import unittest
import networkx as nx
import pandas as pd

from analysis.sna_metrics import (
    compute_sna_metrics,
    extract_connected_components,
    get_top_influential_vessels,
    export_metrics_to_dict,
)


class TestSNAMetrics(unittest.TestCase):
    """Test suite for SNA metrics and centrality calculations."""

    def setUp(self):
        """
        Create a line graph: 1 - 2 - 3, where node 2 is the bridge.
        Node 2 should have the highest betweenness centrality (1.0).
        """
        self.G = nx.Graph()
        self.G.add_node("1", vessel_name="VESSEL_1", flag="Panama", flag_risk_weight=0.5, ais_gap_count=2, spoofing_incident_count=0)
        self.G.add_node("2", vessel_name="VESSEL_2", flag="Liberia", flag_risk_weight=0.6, ais_gap_count=4, spoofing_incident_count=1)
        self.G.add_node("3", vessel_name="VESSEL_3", flag="Malta", flag_risk_weight=0.2, ais_gap_count=0, spoofing_incident_count=0)
        self.G.add_edge("1", "2", weight=0.8, interaction_risk=0.8)
        self.G.add_edge("2", "3", weight=0.5, interaction_risk=0.5)

    def test_compute_sna_metrics_columns_and_values(self):
        """Verify computed metric columns and expected mathematical bounds."""
        df = compute_sna_metrics(self.G)
        self.assertEqual(len(df), 3)

        expected_cols = [
            "mmsi", "vessel_name", "degree_centrality", "betweenness_centrality",
            "closeness_centrality", "clustering_coefficient", "component_id"
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns)

        # Check bridge vessel (node '2') has highest betweenness
        row_2 = df[df["mmsi"] == "2"].iloc[0]
        row_1 = df[df["mmsi"] == "1"].iloc[0]
        row_3 = df[df["mmsi"] == "3"].iloc[0]

        self.assertGreater(row_2["betweenness_centrality"], row_1["betweenness_centrality"])
        self.assertGreater(row_2["betweenness_centrality"], row_3["betweenness_centrality"])
        self.assertAlmostEqual(row_2["betweenness_centrality"], 1.0)
        self.assertAlmostEqual(row_1["betweenness_centrality"], 0.0)

    def test_connected_components_multi_clusters(self):
        """Verify detection of multiple disconnected components."""
        # Add an isolated pair: 4 - 5
        self.G.add_node("4", vessel_name="ISOLATED_4", flag="Gabon")
        self.G.add_node("5", vessel_name="ISOLATED_5", flag="Gabon")
        self.G.add_edge("4", "5", weight=0.3)

        components = extract_connected_components(self.G)
        self.assertEqual(len(components), 2)
        # First component should be size 3, second size 2
        self.assertEqual(components[0]["size"], 3)
        self.assertEqual(components[1]["size"], 2)

    def test_get_top_influential_vessels(self):
        """Verify top-N selection logic."""
        df = compute_sna_metrics(self.G)
        top_1 = get_top_influential_vessels(df, metric="betweenness_centrality", top_n=1)
        self.assertEqual(len(top_1), 1)
        self.assertEqual(top_1.iloc[0]["mmsi"], "2")

    def test_export_metrics_to_dict(self):
        """Verify JSON-serializable list of dicts for API consumption."""
        df = compute_sna_metrics(self.G)
        records = export_metrics_to_dict(df)
        self.assertIsInstance(records, list)
        self.assertEqual(len(records), 3)
        self.assertIn("mmsi", records[0])
        self.assertIn("betweenness_centrality", records[0])


if __name__ == "__main__":
    unittest.main()
