"""
Central Maritime Monitoring and Alert Engine.

Generates, suppresses duplicates, and tracks lifecycle review states for
maritime anomaly alerts derived from real NOAA AIS observations.

Supported Alert Categories:
- AIS_OBSERVATION_GAP (Transponder silence)
- UNUSUAL_IDLE_PERIOD (Stationary loitering)
- POSITION_DISCONTINUITY (Kinematic speed leap)
- POTENTIAL_STS_ENCOUNTER (Spatio-temporal rendezvous)
- REPEATED_INTERACTION (Multiple bilateral encounters)
- ELEVATED_ANALYTICAL_RISK (Composite score threshold exceeded)

Review Lifecycle Statuses:
- NEW
- UNDER_INVESTIGATION
- RESOLVED
- DISMISSED
"""

from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
import hashlib
import json
import sqlite3
from pathlib import Path


DEFAULT_ALERT_DB = Path(__file__).resolve().parent.parent / "data" / "processed" / "alerts.db"


class AlertEngine:
    """
    In-memory and SQLite-backed Alert Engine with deduplication,
    evidence preservation, and analyst status updates.
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = Path(db_path or DEFAULT_ALERT_DB)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._seen_hashes: Set[str] = set()
        self._load_seen_hashes()

    def _init_db(self) -> None:
        conn = sqlite3.connect(str(self.db_path))
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                hash_key TEXT UNIQUE,
                mmsi TEXT NOT NULL,
                vessel_name TEXT,
                imo TEXT,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                detection_timestamp TEXT NOT NULL,
                lat REAL,
                lon REAL,
                risk_score REAL,
                supporting_evidence TEXT,
                explanation TEXT,
                review_status TEXT NOT NULL,
                analyst_notes TEXT,
                source_record TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_mmsi ON alerts(mmsi);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(review_status);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(detection_timestamp);")
        conn.commit()
        conn.close()

    def _load_seen_hashes(self) -> None:
        conn = sqlite3.connect(str(self.db_path))
        cur = conn.cursor()
        cur.execute("SELECT hash_key FROM alerts;")
        self._seen_hashes = {row[0] for row in cur.fetchall() if row[0]}
        conn.close()

    def _generate_alert_hash(self, mmsi: str, alert_type: str, timestamp: str, extra: str = "") -> str:
        """Create deterministic fingerprint for duplicate suppression within a time bucket."""
        date_bucket = timestamp[:13] if len(timestamp) >= 13 else timestamp
        raw = f"{mmsi}|{alert_type}|{date_bucket}|{extra}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def create_alert(
        self,
        mmsi: str,
        alert_type: str,
        severity: str,
        detection_timestamp: str,
        vessel_name: Optional[str] = None,
        imo: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        risk_score: Optional[float] = None,
        supporting_evidence: str = "",
        explanation: str = "",
        source_record: Optional[Dict[str, Any]] = None,
        extra_key: str = "",
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new alert with duplicate suppression.
        Returns the created alert dict, or None if duplicate.
        """
        clean_mmsi = str(mmsi).strip()
        hash_key = self._generate_alert_hash(clean_mmsi, alert_type, detection_timestamp, extra_key)

        if hash_key in self._seen_hashes:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        alert_id = f"alt-{clean_mmsi[-4:]}-{hash_key[:8]}"

        alert = {
            "alert_id": alert_id,
            "hash_key": hash_key,
            "mmsi": clean_mmsi,
            "vessel_name": vessel_name or f"Vessel_{clean_mmsi}",
            "imo": imo,
            "alert_type": alert_type,
            "severity": severity.upper(),
            "detection_timestamp": detection_timestamp,
            "lat": lat,
            "lon": lon,
            "risk_score": round(float(risk_score), 4) if risk_score is not None else 0.1,
            "supporting_evidence": supporting_evidence,
            "explanation": explanation,
            "review_status": "NEW",
            "analyst_notes": "",
            "source_record": json.dumps(source_record) if source_record else "{}",
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        conn = sqlite3.connect(str(self.db_path))
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT OR IGNORE INTO alerts (
                    alert_id, hash_key, mmsi, vessel_name, imo, alert_type,
                    severity, detection_timestamp, lat, lon, risk_score,
                    supporting_evidence, explanation, review_status,
                    analyst_notes, source_record, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                alert["alert_id"], alert["hash_key"], alert["mmsi"], alert["vessel_name"],
                alert["imo"], alert["alert_type"], alert["severity"], alert["detection_timestamp"],
                alert["lat"], alert["lon"], alert["risk_score"], alert["supporting_evidence"],
                alert["explanation"], alert["review_status"], alert["analyst_notes"],
                alert["source_record"], alert["created_at"], alert["updated_at"]
            ))
            conn.commit()
            self._seen_hashes.add(hash_key)
            return alert
        finally:
            conn.close()

    def generate_alerts_from_anomalies(
        self,
        gaps: List[Dict[str, Any]],
        idles: List[Dict[str, Any]],
        jumps: List[Dict[str, Any]],
        encounters: Optional[List[Dict[str, Any]]] = None,
        risk_scores: Optional[Dict[str, float]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Batch-process raw detected anomalies into deduplicated structured alerts.
        """
        created: List[Dict[str, Any]] = []

        # 1. Gaps
        for g in gaps:
            dur_h = float(g.get("gap_duration_hours", 1.0))
            severity = "CRITICAL" if dur_h >= 12.0 else ("HIGH" if dur_h >= 4.0 else "MEDIUM")
            alt = self.create_alert(
                mmsi=g["mmsi"],
                alert_type="AIS_OBSERVATION_GAP",
                severity=severity,
                detection_timestamp=g["detection_timestamp"],
                vessel_name=g.get("vessel_name"),
                lat=g.get("last_lat"),
                lon=g.get("last_lon"),
                risk_score=(risk_scores or {}).get(str(g["mmsi"]), 0.5),
                supporting_evidence=g.get("explanation", ""),
                explanation=g.get("explanation", ""),
                source_record=g,
            )
            if alt:
                created.append(alt)

        # 2. Idle periods
        for i in idles:
            dur_h = float(i.get("duration_hours", 1.0))
            severity = "HIGH" if dur_h >= 12.0 else "MEDIUM"
            alt = self.create_alert(
                mmsi=i["mmsi"],
                alert_type="UNUSUAL_IDLE_PERIOD",
                severity=severity,
                detection_timestamp=i["detection_timestamp"],
                vessel_name=i.get("vessel_name"),
                lat=i.get("lat"),
                lon=i.get("lon"),
                risk_score=(risk_scores or {}).get(str(i["mmsi"]), 0.4),
                supporting_evidence=i.get("explanation", ""),
                explanation=i.get("explanation", ""),
                source_record=i,
            )
            if alt:
                created.append(alt)

        # 3. Position jumps
        for j in jumps:
            speed = float(j.get("implied_speed_knots", 0.0))
            severity = "CRITICAL" if speed >= 60.0 else "HIGH"
            alt = self.create_alert(
                mmsi=j["mmsi"],
                alert_type="POSITION_DISCONTINUITY",
                severity=severity,
                detection_timestamp=j["detection_timestamp"],
                vessel_name=j.get("vessel_name"),
                risk_score=(risk_scores or {}).get(str(j["mmsi"]), 0.6),
                supporting_evidence=j.get("explanation", ""),
                explanation=j.get("explanation", ""),
                source_record=j,
            )
            if alt:
                created.append(alt)

        # 4. Encounters
        if encounters:
            for e in encounters:
                u, v = e.get("source_mmsi"), e.get("target_mmsi")
                cnt = int(e.get("interaction_count", 1))
                a_type = "REPEATED_INTERACTION" if cnt > 1 else "POTENTIAL_STS_ENCOUNTER"
                sev = "CRITICAL" if cnt >= 3 else ("HIGH" if cnt == 2 else "MEDIUM")
                for m in (u, v):
                    if m:
                        alt = self.create_alert(
                            mmsi=str(m),
                            alert_type=a_type,
                            severity=sev,
                            detection_timestamp=str(e.get("first_encounter", e.get("encounter_timestamp", ""))),
                            lat=float(e.get("lat", 0.0)),
                            lon=float(e.get("lon", 0.0)),
                            risk_score=float(e.get("interaction_risk", 0.5)),
                            supporting_evidence=str(e.get("supporting_evidence", "")),
                            explanation=f"Co-located interaction with vessel {v if m == u else u}.",
                            source_record=e,
                            extra_key=f"{u}-{v}",
                        )
                        if alt:
                            created.append(alt)

        return created

    def get_alerts(
        self,
        mmsi: Optional[str] = None,
        severity: Optional[str] = None,
        alert_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Query alert history with optional filtering."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        query = "SELECT * FROM alerts WHERE 1=1"
        params: List[Any] = []

        if mmsi:
            query += " AND mmsi = ?"
            params.append(str(mmsi).strip())
        if severity:
            query += " AND severity = ?"
            params.append(severity.upper())
        if alert_type:
            query += " AND alert_type = ?"
            params.append(alert_type)
        if status:
            query += " AND review_status = ?"
            params.append(status.upper())

        query += " ORDER BY detection_timestamp DESC LIMIT ?;"
        params.append(limit)

        cur.execute(query, params)
        rows = cur.fetchall()
        alerts = [dict(r) for r in rows]
        conn.close()
        return alerts

    def update_alert_status(
        self,
        alert_id: str,
        new_status: str,
        analyst_notes: Optional[str] = None,
    ) -> bool:
        """Update analyst review status (NEW, UNDER_INVESTIGATION, RESOLVED, DISMISSED)."""
        valid_statuses = {"NEW", "UNDER_INVESTIGATION", "RESOLVED", "DISMISSED"}
        st = new_status.upper().strip()
        if st not in valid_statuses:
            raise ValueError(f"Invalid alert status '{new_status}'. Must be one of {valid_statuses}")

        now_iso = datetime.now(timezone.utc).isoformat()
        conn = sqlite3.connect(str(self.db_path))
        cur = conn.cursor()

        if analyst_notes:
            cur.execute("""
                UPDATE alerts
                SET review_status = ?, analyst_notes = ?, updated_at = ?
                WHERE alert_id = ?;
            """, (st, analyst_notes, now_iso, alert_id))
        else:
            cur.execute("""
                UPDATE alerts
                SET review_status = ?, updated_at = ?
                WHERE alert_id = ?;
            """, (st, now_iso, alert_id))

        updated = cur.rowcount > 0
        conn.commit()
        conn.close()
        return updated

