"""Unit tests for analysis/risk_scoring.py."""

import unittest
import pandas as pd

from analysis.risk_scoring import (
    compute_composite_risk_scores,
    categorize_risk_tiers,
)


class TestRiskScoring(unittest.TestCase):
    """Test suite for composite risk score engine."""

    def setUp(self):
        self.metrics_sample = pd.DataFrame([
            {
                "mmsi": "101",
                "vessel_name": "HIGH_RISK_BRIDGE",
                "degree_centrality": 0.8,
                "betweenness_centrality": 0.9,
                "flag_risk_weight": 0.85,
                "ais_gap_count": 10,
                "spoofing_incident_count": 4,
            },
            {
                "mmsi": "102",
                "vessel_name": "LEGITIMATE_CARRIER",
                "degree_centrality": 0.1,
                "betweenness_centrality": 0.0,
                "flag_risk_weight": 0.15,
                "ais_gap_count": 0,
                "spoofing_incident_count": 0,
            },
        ])

    def test_compute_composite_risk_scores_bounds(self):
        """Verify computed scores are strictly bounded between 0.0 and 1.0."""
        df = compute_composite_risk_scores(self.metrics_sample)
        self.assertEqual(len(df), 2)
        for _, row in df.iterrows():
            self.assertGreaterEqual(row["composite_risk_score"], 0.0)
            self.assertLessEqual(row["composite_risk_score"], 1.0)
            self.assertIn("risk_tier", row)
            self.assertIn("primary_risk_driver", row)

        # High risk vessel should outscore legitimate carrier
        score_high = df[df["mmsi"] == "101"]["composite_risk_score"].iloc[0]
        score_low = df[df["mmsi"] == "102"]["composite_risk_score"].iloc[0]
        self.assertGreater(score_high, score_low)

    def test_custom_weights(self):
        """Verify that passing custom weights alters score emphasis appropriately."""
        # Focus 100% weight on betweenness
        custom_weights = {
            "weight_degree": 0.0,
            "weight_betweenness": 1.0,
            "weight_flag": 0.0,
            "weight_ais_gaps": 0.0,
            "weight_spoofing": 0.0,
        }
        df = compute_composite_risk_scores(self.metrics_sample, weights=custom_weights)
        row_101 = df[df["mmsi"] == "101"].iloc[0]
        self.assertAlmostEqual(row_101["composite_risk_score"], 0.9, places=2)

    def test_categorize_risk_tiers(self):
        """Verify threshold binning logic."""
        self.assertEqual(categorize_risk_tiers(0.75), "CRITICAL_MONITORING")
        self.assertEqual(categorize_risk_tiers(0.50), "ELEVATED_ATTENTION")
        self.assertEqual(categorize_risk_tiers(0.30), "MODERATE_INTERACTION")
        self.assertEqual(categorize_risk_tiers(0.10), "BASELINE_LEGITIMATE")


if __name__ == "__main__":
    unittest.main()
