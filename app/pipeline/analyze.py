import sys
import time
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd

from app import config
from app.db import SessionLocal, Vessel, Interaction, RiskResult, init_db, engine


def load_recent(hours=24):
    """Loads recent GPS positions from SQLite database."""
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours)
    return pd.read_sql(
        "SELECT mmsi, ts, lat, lon, speed FROM positions WHERE ts >= ?",
        engine,
        params=(since,),
        parse_dates=["ts"]
    )


def count_gaps(df):
    """Identifies and counts silent AIS transponder periods longer than GAP_MINUTES."""
    if df.empty:
        return pd.Series(dtype=int)
    df = df.sort_values(["mmsi", "ts"]).copy()
    df["gap_min"] = df.groupby("mmsi")["ts"].diff().dt.total_seconds() / 60
    return df[df["gap_min"] > config.GAP_MINUTES].groupby("mmsi").size()


def haversine_nm(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two GPS coordinates in nautical miles."""
    r = 3440.065  # Earth radius in NM
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi, dl = p2 - p1, np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(a))


def find_rendezvous(df):
    """
    Detects potential Ship-to-Ship (STS) transfers:
    Two vessels within 0.5 NM traveling < 3.0 knots for at least 30 minutes.
    """
    slow = df[df["speed"] < config.RENDEZVOUS_SPEED].copy()
    if slow.empty:
        return pd.DataFrame()

    slow["bucket"] = slow["ts"].dt.floor("10min")
    slow["cx"] = np.floor(slow["lat"] / 0.01).astype(int)   # ~1 km grid cells
    slow["cy"] = np.floor(slow["lon"] / 0.01).astype(int)

    slow = slow.drop_duplicates(["mmsi", "bucket"])
    pairs = slow.merge(slow, on=["bucket", "cx", "cy"], suffixes=("_a", "_b"))
    pairs = pairs[pairs["mmsi_a"] < pairs["mmsi_b"]]
    pairs["dist_nm"] = haversine_nm(pairs.lat_a, pairs.lon_a, pairs.lat_b, pairs.lon_b)
    pairs = pairs[pairs["dist_nm"] <= config.RENDEZVOUS_NM]

    if pairs.empty:
        return pd.DataFrame()

    out = (pairs.groupby(["mmsi_a", "mmsi_b"])
                .agg(buckets=("bucket", "nunique"), min_distance_nm=("dist_nm", "min"))
                .reset_index())
    out["duration_hours"] = out["buckets"] * 10 / 60
    return out[out["duration_hours"] * 60 >= config.RENDEZVOUS_MIN_MINUTES]


def run_once():
    """Executes a single cycle of dark gap detection, rendezvous analysis, and risk scoring."""
    init_db()
    df = load_recent()
    if df.empty:
        print("ℹ️ [Analysis Engine] No recent positions in database yet. Run ingest first.")
        return

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    gaps = count_gaps(df)
    rv = find_rendezvous(df)

    with SessionLocal() as db:
        # 1. Update Interactions Table
        db.query(Interaction).delete()
        for _, r in rv.iterrows():
            db.add(Interaction(
                mmsi_a=str(r.mmsi_a),
                mmsi_b=str(r.mmsi_b),
                count=int(r.buckets),
                avg_duration_hours=float(r.duration_hours),
                min_distance_nm=float(r.min_distance_nm),
                risk=float(min(1.0, r.duration_hours / 6.0)),
                computed_at=now
            ))
        db.commit()

        # 2. Invoke Graph Builder, SNA Metrics, and Risk Scoring
        try:
            from analysis.graph_builder import build_vessel_graph
            from analysis.sna_metrics import compute_sna_metrics
            from analysis.risk_scoring import compute_composite_risk_scores

            # Build vessels metadata DataFrame
            vessels_in_db = db.query(Vessel).all()
            v_rows = []
            for v in vessels_in_db:
                v_rows.append({
                    "mmsi": str(v.mmsi),
                    "vessel_name": str(v.name or f"Vessel_{v.mmsi}"),
                    "flag": "Panama" if str(v.mmsi)[:3] == "352" else "Liberia",
                    "vessel_type": "Tanker" if (v.ship_type and 80 <= v.ship_type <= 89) else "Cargo",
                    "flag_risk_weight": 0.70 if str(v.mmsi)[:3] in ["352", "636"] else 0.20,
                    "ais_gap_count": int(gaps.get(str(v.mmsi), 0)),
                    "spoofing_incident_count": 0
                })
            vessels_df = pd.DataFrame(v_rows)

            # Build interactions DataFrame with required columns
            int_rows = []
            for _, r in rv.iterrows():
                int_rows.append({
                    "source_mmsi": str(r.mmsi_a),
                    "target_mmsi": str(r.mmsi_b),
                    "interaction_type": "STS_TRANSFER",
                    "interaction_count": int(r.buckets),
                    "avg_duration_hours": float(r.duration_hours),
                    "avg_distance_nm": float(r.min_distance_nm),
                    "interaction_risk": float(min(1.0, r.duration_hours / 6.0))
                })
            interactions_df = pd.DataFrame(int_rows)

            if not vessels_df.empty:
                # 1. Build Graph
                G = build_vessel_graph(vessels_df, interactions_df)

                # 2. Compute SNA Metrics
                metrics_df = compute_sna_metrics(G)

                # 3. Compute Composite Risk Scores
                scored = compute_composite_risk_scores(metrics_df)

                # 4. Persist to RiskResult table
                db.query(RiskResult).delete()
                for _, row in scored.iterrows():
                    db.add(RiskResult(
                        mmsi=str(row["mmsi"]),
                        score=float(row.get("composite_risk_score", 0.5)),
                        tier=str(row.get("risk_tier", "ELEVATED_ATTENTION")),
                        reasons=[str(row.get("primary_risk_driver", "Rendezvous activity"))],
                        degree=float(row.get("degree_centrality", 0.0)),
                        betweenness=float(row.get("betweenness_centrality", 0.0)),
                        gap_count=int(row.get("ais_gap_count", 0)),
                        community=int(row.get("community_id", row.get("community", 1))),
                        computed_at=now
                    ))
                db.commit()
                print(f"📊 [Analysis Engine] SNA algorithms executed successfully! Scored {len(scored)} vessels.")
        except Exception as e:
            print("⚠️ [Analysis Engine] Execution note:", e)

    print(f"✅ [Analysis Engine] Cycle complete. Detected {len(rv)} rendezvous pairs.")


if __name__ == "__main__":
    if "--loop" in sys.argv:
        while True:
            run_once()
            time.sleep(config.ANALYSIS_EVERY_SECONDS)
    else:
        run_once()
