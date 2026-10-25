"""Unit tests for analysis/aco_optimizer.py."""

import unittest
import networkx as nx

from analysis.aco_optimizer import AntColonyPathOptimizer, ACOResult


class TestACOOptimizer(unittest.TestCase):
    """Test suite for Ant Colony Optimization graph path finder."""

    def setUp(self):
        """Create a graph with multiple alternative paths."""
        self.G = nx.Graph()
        # Path A: 1 -> 2 -> 4 (high risk transfer route)
        # Path B: 1 -> 3 -> 4 (low risk route)
        self.G.add_node("1", vessel_name="ORIGIN_TANKER")
        self.G.add_node("2", vessel_name="INTERMEDIARY_HIGH_RISK")
        self.G.add_node("3", vessel_name="INTERMEDIARY_LOW_RISK")
        self.G.add_node("4", vessel_name="DESTINATION_HUB")

        self.G.add_edge("1", "2", interaction_risk=0.9, interaction_count=5, avg_distance_nm=0.05)
        self.G.add_edge("2", "4", interaction_risk=0.85, interaction_count=4, avg_distance_nm=0.04)

        self.G.add_edge("1", "3", interaction_risk=0.2, interaction_count=1, avg_distance_nm=0.8)
        self.G.add_edge("3", "4", interaction_risk=0.15, interaction_count=1, avg_distance_nm=0.7)

        # Disconnected node
        self.G.add_node("99", vessel_name="DISCONNECTED_VESSEL")

    def test_aco_finds_valid_connected_path(self):
        """Verify ACO finds a valid path from origin to destination."""
        optimizer = AntColonyPathOptimizer(
            self.G,
            num_ants=10,
            num_iterations=15,
            seed=42,
        )
        result = optimizer.find_optimal_path(source="1", destination="4")
        self.assertIsInstance(result, ACOResult)
        self.assertTrue(result.found_valid_path)
        self.assertEqual(result.source, "1")
        self.assertEqual(result.destination, "4")

        # Path must start with source and end with destination
        self.assertEqual(result.best_path[0], "1")
        self.assertEqual(result.best_path[-1], "4")

        # Every consecutive hop must be a real edge in G
        for i in range(len(result.best_path) - 1):
            u, v = result.best_path[i], result.best_path[i + 1]
            self.assertTrue(self.G.has_edge(u, v))

        self.assertGreater(result.path_fitness, 0.0)
        self.assertGreater(len(result.convergence_history), 0)

    def test_aco_prefers_higher_risk_heuristic_path(self):
        """Verify that with high beta/alpha, the high-risk path (1->2->4) is preferred."""
        optimizer = AntColonyPathOptimizer(
            self.G,
            num_ants=15,
            num_iterations=20,
            alpha=1.0,
            beta=3.0,
            seed=42,
        )
        result = optimizer.find_optimal_path(source="1", destination="4")
        self.assertEqual(result.best_path, ["1", "2", "4"])
        self.assertIn("INTERMEDIARY_HIGH_RISK", result.best_path_vessel_names)

    def test_aco_disconnected_path(self):
        """Verify graceful handling when source and destination are in separate components."""
        optimizer = AntColonyPathOptimizer(self.G, num_ants=5, num_iterations=5, seed=42)
        result = optimizer.find_optimal_path(source="1", destination="99")
        self.assertFalse(result.found_valid_path)
        self.assertEqual(result.best_path, [])
        self.assertEqual(result.path_fitness, 0.0)

    def test_aco_invalid_node_raises_error(self):
        """Verify unknown node raises informative ValueError."""
        optimizer = AntColonyPathOptimizer(self.G)
        with self.assertRaises(ValueError):
            optimizer.find_optimal_path(source="NON_EXISTENT", destination="4")

    def test_aco_result_disclaimer_and_dict(self):
        """Verify the mandatory ethical disclaimer is present and serializable."""
        optimizer = AntColonyPathOptimizer(self.G, num_ants=5, num_iterations=5, seed=42)
        result = optimizer.find_optimal_path(source="1", destination="4")
        d = result.to_dict()
        self.assertIn("disclaimer", d)
        self.assertIn("proof", d["disclaimer"].lower())


if __name__ == "__main__":
    unittest.main()
