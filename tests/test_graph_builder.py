"""Unit tests for analysis/graph_builder.py."""

import unittest
from pathlib import Path
import pandas as pd
import networkx as nx

from analysis.graph_builder import (
    load_vessel_data,
    load_interaction_data,
    build_vessel_graph,
    get_graph_summary,
)


class TestGraphBuilder(unittest.TestCase):
    """Test suite for graph construction and data ingestion."""

    def setUp(self):
        """Set up small synthetic in-memory fixtures."""
        self.vessels_data = pd.DataFrame([
            {"mmsi": "1001", "vessel_name": "MOCK_ALPHA", "flag": "Panama", "flag_risk_weight": 0.7, "ais_gap_count": 5},
            {"mmsi": "1002", "vessel_name": "MOCK_BETA", "flag": "Liberia", "flag_risk_weight": 0.6, "ais_gap_count": 3},
            {"mmsi": "1003", "vessel_name": "MOCK_GAMMA", "flag": "Malta", "flag_risk_weight": 0.3, "ais_gap_count": 1},
        ])
        self.interactions_data = pd.DataFrame([
            {"source_mmsi": "1001", "target_mmsi": "1002", "interaction_type": "STS_TRANSFER", "interaction_risk": 0.8, "interaction_count": 3},
            {"source_mmsi": "1002", "target_mmsi": "1003", "interaction_type": "PROXIMITY_EVENT", "interaction_risk": 0.5, "interaction_count": 1},
        ])

    def test_load_vessel_data_dataframe(self):
        """Verify load_vessel_data handles pandas DataFrame and casts MMSI to string."""
        df = load_vessel_data(self.vessels_data)
        self.assertEqual(len(df), 3)
        self.assertEqual(df["mmsi"].tolist(), ["1001", "1002", "1003"])
        self.assertIn("flag_risk_weight", df.columns)

    def test_load_interaction_data_dataframe(self):
        """Verify load_interaction_data fills default fields and normalizes MMSI."""
        df = load_interaction_data(self.interactions_data)
        self.assertEqual(len(df), 2)
        self.assertEqual(df["source_mmsi"].iloc[0], "1001")
        self.assertEqual(df["target_mmsi"].iloc[0], "1002")

    def test_build_undirected_graph(self):
        """Verify undirected graph construction, node counts, and edge weights."""
        G = build_vessel_graph(self.vessels_data, self.interactions_data, directed=False)
        self.assertIsInstance(G, nx.Graph)
        self.assertFalse(G.is_directed())
        self.assertEqual(G.number_of_nodes(), 3)
        self.assertEqual(G.number_of_edges(), 2)

        # Check node attributes
        self.assertEqual(G.nodes["1001"]["vessel_name"], "MOCK_ALPHA")
        self.assertEqual(G.nodes["1001"]["flag"], "Panama")

        # Check edge attributes
        self.assertTrue(G.has_edge("1001", "1002"))
        edge_data = G.get_edge_data("1001", "1002")
        self.assertEqual(edge_data["interaction_type"], "STS_TRANSFER")
        self.assertAlmostEqual(edge_data["interaction_risk"], 0.8)

    def test_unregistered_vessel_auto_addition(self):
        """Verify that a vessel present in interactions but absent from vessel metadata is gracefully added."""
        extra_interaction = pd.DataFrame([
            {"source_mmsi": "1001", "target_mmsi": "9999", "interaction_type": "BUNKERING", "interaction_risk": 0.4}
        ])
        G = build_vessel_graph(self.vessels_data, extra_interaction)
        self.assertTrue(G.has_node("9999"))
        self.assertEqual(G.nodes["9999"]["vessel_name"], "UNREGISTERED_9999")

    def test_graph_summary(self):
        """Verify summary calculations."""
        G = build_vessel_graph(self.vessels_data, self.interactions_data)
        summary = get_graph_summary(G)
        self.assertEqual(summary["num_nodes"], 3)
        self.assertEqual(summary["num_edges"], 2)
        self.assertEqual(summary["num_connected_components"], 1)
        self.assertTrue(summary["is_connected"])
        self.assertGreater(summary["average_degree"], 0.0)


if __name__ == "__main__":
    unittest.main()
