"""
Tests for FastAPI backend routes and API response schemas.
Directly tests route logic against SQLite session, ensuring high performance
and compatibility without thread-blocking portal deadlocks on Windows Python 3.14.
"""

import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pytest
from app.db import init_db, SessionLocal, Vessel, RiskResult, Interaction
from app.main import (
    health_check,
    list_vessels,
    get_vessel_detail,
    get_network_graph,
    get_network_communities,
    get_network_similarity,
    traverse_bfs,
    list_alerts,
    update_alert,
    get_ingestion_status,
    run_aco_path,
    ACORequest,
    AlertStatusUpdate,
)


@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    # Ensure sample vessel exists
    v = db.get(Vessel, "999000001")
    if not v:
        v = Vessel(mmsi="999000001", name="TEST_VESSEL_1", ship_type=80, flag_mid="352")
        db.add(v)
        r = RiskResult(mmsi="999000001", score=0.65, tier="CRITICAL_MONITORING", reasons=["Test gap"], degree=0.4, betweenness=0.3)
        db.add(r)
        db.commit()
    yield db
    db.close()


def test_health(db_session):
    res = health_check(db_session)
    assert res["status"] == "ok"
    assert res["database"] == "connected"


def test_vessels_list(db_session):
    res = list_vessels(search=None, tier=None, vessel_type=None, limit=100, offset=0, db=db_session)
    assert isinstance(res, list)
    assert len(res) > 0
    assert "mmsi" in res[0]
    assert "risk_score" in res[0]


def test_vessel_detail(db_session):
    res = get_vessel_detail("999000001", db=db_session)
    assert res["mmsi"] == "999000001"
    assert "risk_score" in res
    assert "connected_peers" in res


def test_network_graph():
    res = get_network_graph(is_multigraph=False, start_time=None, end_time=None)
    assert "elements" in res
    assert "summary" in res
    assert isinstance(res["elements"], list)


def test_network_communities():
    res = get_network_communities()
    assert "communities" in res
    assert "total_communities" in res


def test_network_similarity():
    res = get_network_similarity()
    assert "vessel_ids" in res
    assert "matrix" in res


def test_traversal_bfs():
    res = traverse_bfs(start_mmsi="999000001", max_depth=2)
    assert "visited_order" in res
    assert res["start_node"] == "999000001"


def test_ingestion_status():
    res = get_ingestion_status()
    assert "dataset_name" in res
    assert "source" in res
    assert "temporal_range" in res


def test_alerts_and_status_update():
    alerts = list_alerts(mmsi=None, severity=None, alert_type=None, status=None, limit=10)
    assert isinstance(alerts, list)
    if alerts:
        a_id = alerts[0]["alert_id"]
        res = update_alert(a_id, AlertStatusUpdate(status="UNDER_INVESTIGATION", notes="Checked via test"))
        assert res["status"] == "success"
        assert res["new_status"] == "UNDER_INVESTIGATION"


def test_aco_pathfinder():
    req = ACORequest(source="999000001", destination="999000001", num_ants=5, num_iterations=5)
    res = run_aco_path(req)
    assert "disclaimer" in res
    assert "path" in res
