from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["database"] == "connected"


def test_vessels_list():
    res = client.get("/api/vessels")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_unknown_vessel_404():
    res = client.get("/api/vessels/000000000")
    assert res.status_code == 404


def test_ranking_has_disclaimer():
    res = client.get("/api/risk/ranking")
    assert res.status_code == 200
    body = res.json()
    assert "disclaimer" in body
    assert "ranking" in body


def test_network_graph():
    res = client.get("/api/network/graph")
    assert res.status_code == 200
    body = res.json()
    assert "nodes" in body
    assert "edges" in body


def test_ingestion_status():
    res = client.get("/api/status/ingestion")
    assert res.status_code == 200
    assert "is_streaming" in res.json()
