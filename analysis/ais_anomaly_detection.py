"""
Real AIS Anomaly Detection Engine.

Implements maritime surveillance indicators from real NOAA AIS vessel-track observations:
1. AIS Observation Gaps (transponder blackout / coverage dropouts)
2. Idle / Stationary Loitering (prolonged zero-speed holding outside port limits)
3. Kinematic Position Discontinuities (implausible speed jumps between consecutive tracks)
4. Potential Ship-to-Ship (STS) Encounters (co-located, low-speed spatio-temporal overlaps)
5. Repeated Vessel Interactions (multiple bilateral encounters across time)

ACADEMIC & LEGAL DISCLAIMER:
All indicators represent mathematical anomalies and investigative triage leads.
They do NOT constitute legal proof of illegal activity, sanctions evasion,
or definitive shadow fleet membership.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import math
import pandas as pd
import numpy as np


DISCLAIMER = (
    "All detected anomaly events are exploratory triage indicators based on observational "
    "heuristics and NOAA AIS reception characteristics. They do NOT constitute legal proof "
    "of illicit maritime operations, intentional transponder deactivation, or shadow fleet activity."
)


def haversine_nm(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate Great Circle distance in nautical miles between two coordinates."""
    r_nm = 3440.065
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r_nm * math.asin(math.sqrt(max(0.0, min(1.0, a))))


def detect_ais_observation_gaps(
    tracks_df: pd.DataFrame,
    min_gap_minutes: float = 60.0,
) -> List[Dict[str, Any]]:
    """
    Detects temporal gaps between consecutive track segments for each vessel.
    Formula: gap_duration = next_track_start - previous_track_end
    """
    if tracks_df.empty or "mmsi" not in tracks_df.columns:
        return []

    df = tracks_df.copy()
    df["start_dt"] = pd.to_datetime(df["start_time"], utc=True)
    df["end_dt"] = pd.to_datetime(df["end_time"], utc=True)
    df = df.sort_values(["mmsi", "start_dt"]).reset_index(drop=True)

    gaps: List[Dict[str, Any]] = []

    for mmsi, group in df.groupby("mmsi"):
        if len(group) < 2:
            continue

        prev_row = None
        for _, row in group.iterrows():
            if prev_row is not None:
                gap_sec = (row["start_dt"] - prev_row["end_dt"]).total_seconds()
                gap_min = gap_sec / 60.0

                if gap_min >= min_gap_minutes:
                    prev_lat, prev_lon = prev_row.get("end_lat", 0.0), prev_row.get("end_lon", 0.0)
                    curr_lat, curr_lon = row.get("start_lat", 0.0), row.get("start_lon", 0.0)
                    jump_nm = haversine_nm(prev_lon, prev_lat, curr_lon, curr_lat) if (prev_lat and curr_lat) else 0.0

                    gap_event = {
                        "mmsi": str(mmsi),
                        "vessel_name": str(row.get("vessel_name", f"Vessel_{mmsi}")),
                        "alert_type": "AIS_OBSERVATION_GAP",
                        "detection_timestamp": row["start_dt"].isoformat(),
                        "last_observed_time": prev_row["end_dt"].isoformat(),
                        "next_observed_time": row["start_dt"].isoformat(),
                        "gap_duration_minutes": round(gap_min, 1),
                        "gap_duration_hours": round(gap_min / 60.0, 2),
                        "last_lat": prev_lat,
                        "last_lon": prev_lon,
                        "next_lat": curr_lat,
                        "next_lon": curr_lon,
                        "jump_nm_during_gap": round(jump_nm, 2),
                        "explanation": (
                            f"AIS transponder signal gap of {gap_min:.1f} minutes recorded. "
                            f"Separation during silence: {jump_nm:.1f} nm. Note: Gaps can stem from "
                            f"terrestrial antenna shadow, satellite receiver re-visit latency, or power interruptions."
                        ),
                        "disclaimer": DISCLAIMER,
                    }
                    gaps.append(gap_event)
            prev_row = row

    return gaps


def detect_idle_periods(
    tracks_df: pd.DataFrame,
    min_duration_minutes: float = 60.0,
    max_displacement_nm: float = 0.5,
    max_speed_kn: float = 1.5,
) -> List[Dict[str, Any]]:
    """
    Identifies extended stationary loitering or anchoring periods.
    """
    if tracks_df.empty:
        return []

    idle_events: List[Dict[str, Any]] = []

    for _, row in tracks_df.iterrows():
        dur = float(row.get("duration_minutes", 0.0))
        disp = float(row.get("displacement_nm", 0.0))
        speed = float(row.get("avg_speed_kn", 0.0))

        if dur >= min_duration_minutes and disp <= max_displacement_nm and speed <= max_speed_kn:
            mmsi = str(row["mmsi"])
            c_lat = float(row.get("centroid_lat", row.get("start_lat", 0.0)))
            c_lon = float(row.get("centroid_lon", row.get("start_lon", 0.0)))

            idle_events.append({
                "mmsi": mmsi,
                "vessel_name": str(row.get("vessel_name", f"Vessel_{mmsi}")),
                "alert_type": "UNUSUAL_IDLE_PERIOD",
                "detection_timestamp": str(row.get("start_time", "")),
                "duration_minutes": round(dur, 1),
                "duration_hours": round(dur / 60.0, 2),
                "lat": c_lat,
                "lon": c_lon,
                "displacement_nm": disp,
                "avg_speed_kn": speed,
                "explanation": (
                    f"Vessel remained stationary within {disp:.2f} nm for {dur / 60.0:.1f} hours. "
                    f"Average calculated drift speed: {speed:.1f} kn. May reflect standard roadstead anchorage, "
                    f"bunkering hold, or offshore loitering."
                ),
                "disclaimer": DISCLAIMER,
            })

    return idle_events


def detect_position_discontinuities(
    tracks_df: pd.DataFrame,
    max_plausible_speed_kn: float = 35.0,
    min_gap_minutes_for_jump: float = 5.0,
) -> List[Dict[str, Any]]:
    """
    Identifies implausible coordinate leaps between successive tracks of the same vessel
    where distance / time delta exceeds physical vessel capabilities (> 35 knots for commercial ships).
    """
    if tracks_df.empty or "mmsi" not in tracks_df.columns:
        return []

    df = tracks_df.copy()
    df["start_dt"] = pd.to_datetime(df["start_time"], utc=True)
    df["end_dt"] = pd.to_datetime(df["end_time"], utc=True)
    df = df.sort_values(["mmsi", "start_dt"]).reset_index(drop=True)

    jumps: List[Dict[str, Any]] = []

    for mmsi, group in df.groupby("mmsi"):
        if len(group) < 2:
            continue

        prev_row = None
        for _, row in group.iterrows():
            if prev_row is not None:
                gap_sec = (row["start_dt"] - prev_row["end_dt"]).total_seconds()
                gap_hours = gap_sec / 3600.0

                if gap_hours > (min_gap_minutes_for_jump / 60.0) and gap_hours < 72.0:
                    prev_lat, prev_lon = prev_row.get("end_lat", 0.0), prev_row.get("end_lon", 0.0)
                    curr_lat, curr_lon = row.get("start_lat", 0.0), row.get("start_lon", 0.0)

                    if prev_lat and curr_lat:
                        dist_nm = haversine_nm(prev_lon, prev_lat, curr_lon, curr_lat)
                        implied_speed = dist_nm / gap_hours if gap_hours > 0 else 0.0

                        if implied_speed > max_plausible_speed_kn and dist_nm >= 10.0:
                            jumps.append({
                                "mmsi": str(mmsi),
                                "vessel_name": str(row.get("vessel_name", f"Vessel_{mmsi}")),
                                "alert_type": "POSITION_DISCONTINUITY",
                                "detection_timestamp": row["start_dt"].isoformat(),
                                "jump_distance_nm": round(dist_nm, 2),
                                "time_elapsed_hours": round(gap_hours, 2),
                                "implied_speed_knots": round(implied_speed, 1),
                                "origin_coords": (round(prev_lat, 4), round(prev_lon, 4)),
                                "destination_coords": (round(curr_lat, 4), round(curr_lon, 4)),
                                "explanation": (
                                    f"Implausible position leap of {dist_nm:.1f} nm in {gap_hours:.1f}h "
                                    f"(implied velocity {implied_speed:.1f} kn exceeds commercial threshold {max_plausible_speed_kn} kn). "
                                    f"Candidate transponder offset, GNSS interference, or multi-transceiver ID collision."
                                ),
                                "disclaimer": DISCLAIMER,
                            })
            prev_row = row

    return jumps


def detect_vessel_encounters(
    tracks_df: pd.DataFrame,
    max_distance_nm: float = 0.5,
    max_speed_kn: float = 3.0,
    min_overlap_minutes: float = 15.0,
) -> pd.DataFrame:
    """
    Detects qualifying spatio-temporal vessel encounters / potential STS events.
    Two vessels with temporal interval overlap, centroid distance <= max_distance_nm,
    and both traveling at low or zero speed.
    """
    if tracks_df.empty or len(tracks_df) < 2:
        return pd.DataFrame()

    df = tracks_df.copy()
    df["start_dt"] = pd.to_datetime(df["start_time"], utc=True)
    df["end_dt"] = pd.to_datetime(df["end_time"], utc=True)

    slow_candidates = df[df["avg_speed_kn"] <= max_speed_kn].copy()
    if len(slow_candidates) < 2:
        slow_candidates = df.copy()

    slow_candidates["time_bucket"] = slow_candidates["start_dt"].dt.floor("4h")

    merged = pd.merge(
        slow_candidates,
        slow_candidates,
        on=["time_bucket"],
        suffixes=("_a", "_b")
    )

    max_deg = (max_distance_nm / 60.0) * 1.5
    pairs = merged[
        (merged["mmsi_a"] < merged["mmsi_b"]) &
        ((merged["centroid_lat_a"] - merged["centroid_lat_b"]).abs() <= max_deg) &
        ((merged["centroid_lon_a"] - merged["centroid_lon_b"]).abs() <= max_deg)
    ].copy()
    if pairs.empty:
        return pd.DataFrame()

    encounters: List[Dict[str, Any]] = []

    for _, row in pairs.iterrows():
        overlap_start = max(row["start_dt_a"], row["start_dt_b"])
        overlap_end = min(row["end_dt_a"], row["end_dt_b"])
        overlap_sec = (overlap_end - overlap_start).total_seconds()
        overlap_min = overlap_sec / 60.0

        if overlap_min >= min_overlap_minutes:
            dist = haversine_nm(
                row["centroid_lon_a"], row["centroid_lat_a"],
                row["centroid_lon_b"], row["centroid_lat_b"]
            )

            if dist <= max_distance_nm:
                dur_h = overlap_min / 60.0
                prox_factor = max(0.1, 1.0 - (dist / max_distance_nm))
                dur_factor = min(1.0, dur_h / 4.0)
                risk = round(0.40 * prox_factor + 0.60 * dur_factor, 4)

                center_lat = round((row["centroid_lat_a"] + row["centroid_lat_b"]) / 2.0, 5)
                center_lon = round((row["centroid_lon_a"] + row["centroid_lon_b"]) / 2.0, 5)

                encounters.append({
                    "source_mmsi": str(row["mmsi_a"]),
                    "target_mmsi": str(row["mmsi_b"]),
                    "source_name": str(row.get("vessel_name_a", f"Vessel_{row['mmsi_a']}")),
                    "target_name": str(row.get("vessel_name_b", f"Vessel_{row['mmsi_b']}")),
                    "interaction_type": "POTENTIAL_STS_ENCOUNTER",
                    "duration_hours": round(dur_h, 2),
                    "min_distance_nm": round(dist, 3),
                    "interaction_risk": risk,
                    "encounter_timestamp": overlap_start.isoformat(),
                    "lat": center_lat,
                    "lon": center_lon,
                    "supporting_evidence": (
                        f"Coordinated zero/low-speed proximity ({dist:.2f} nm) for {dur_h:.1f} hours "
                        f"at ({center_lat}, {center_lon}). Observation overlap between {overlap_start.strftime('%Y-%m-%d %H:%M')} "
                        f"and {overlap_end.strftime('%H:%M UTC')}."
                    ),
                })

    enc_df = pd.DataFrame(encounters)
    if not enc_df.empty:
        agg = enc_df.groupby(["source_mmsi", "target_mmsi"]).agg(
            interaction_count=("interaction_type", "count"),
            avg_duration_hours=("duration_hours", "mean"),
            min_distance_nm=("min_distance_nm", "min"),
            interaction_risk=("interaction_risk", "max"),
            first_encounter=("encounter_timestamp", "min"),
            last_encounter=("encounter_timestamp", "max"),
            lat=("lat", "mean"),
            lon=("lon", "mean"),
            supporting_evidence=("supporting_evidence", "first"),
        ).reset_index()

        agg["interaction_type"] = agg["interaction_count"].apply(
            lambda c: "REPEATED_INTERACTION" if c > 1 else "POTENTIAL_STS_ENCOUNTER"
        )
        agg["avg_duration_hours"] = agg["avg_duration_hours"].round(2)
        agg["min_distance_nm"] = agg["min_distance_nm"].round(3)
        return agg

    return enc_df


def compute_vessel_anomaly_profiles(
    tracks_df: pd.DataFrame,
    encounters_df: Optional[pd.DataFrame] = None,
) -> pd.DataFrame:
    """
    Computes summary anomaly counts and indicators per vessel for risk scoring and profile views.
    """
    if tracks_df.empty:
        return pd.DataFrame()

    cols = ["mmsi"]
    for c in ["vessel_name", "vessel_type_name", "flag"]:
        if c in tracks_df.columns:
            cols.append(c)
    unique_vessels = tracks_df[cols].drop_duplicates("mmsi")
    mmsi_set = set(unique_vessels["mmsi"])

    gaps = detect_ais_observation_gaps(tracks_df)
    idles = detect_idle_periods(tracks_df)
    jumps = detect_position_discontinuities(tracks_df)

    gap_counts: Dict[str, int] = {}
    for g in gaps:
        gap_counts[g["mmsi"]] = gap_counts.get(g["mmsi"], 0) + 1

    idle_counts: Dict[str, int] = {}
    for i in idles:
        idle_counts[i["mmsi"]] = idle_counts.get(i["mmsi"], 0) + 1

    jump_counts: Dict[str, int] = {}
    for j in jumps:
        jump_counts[j["mmsi"]] = jump_counts.get(j["mmsi"], 0) + 1

    encounter_counts: Dict[str, int] = {}
    if encounters_df is not None and not encounters_df.empty:
        for _, row in encounters_df.iterrows():
            u, v = str(row["source_mmsi"]), str(row["target_mmsi"])
            cnt = int(row.get("interaction_count", 1))
            encounter_counts[u] = encounter_counts.get(u, 0) + cnt
            encounter_counts[v] = encounter_counts.get(v, 0) + cnt

    records = []
    for _, row in unique_vessels.iterrows():
        m = str(row["mmsi"])
        n_gaps = gap_counts.get(m, 0)
        n_idles = idle_counts.get(m, 0)
        n_jumps = jump_counts.get(m, 0)
        n_encs = encounter_counts.get(m, 0)
        total_anomalies = n_gaps + n_idles + n_jumps + (1 if n_encs > 1 else 0)

        records.append({
            "mmsi": m,
            "vessel_name": str(row.get("vessel_name", f"Vessel_{m}")),
            "vessel_type_name": str(row.get("vessel_type_name", "Unknown")),
            "flag": str(row.get("flag", "UNKNOWN")),
            "ais_gap_count": n_gaps,
            "idle_period_count": n_idles,
            "spoofing_incident_count": n_jumps,
            "encounter_count": n_encs,
            "total_anomaly_count": total_anomalies,
        })

    return pd.DataFrame(records)

