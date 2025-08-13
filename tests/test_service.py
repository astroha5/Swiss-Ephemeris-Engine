import os
from fastapi.testclient import TestClient

# Ensure EPHE_DIR is unset/empty for tests; engine should fall back safely
os.environ["EPHE_DIR"] = ""

from swiss_calc_engine.service import app  # noqa: E402

client = TestClient(app)


def test_root_and_health():
    r = client.get("/")
    assert r.status_code == 200
    meta = r.json()
    assert meta.get("name")
    assert meta.get("source")
    h = client.get("/health")
    assert h.status_code == 200
    assert h.json().get("status") == "ok"


def test_julian_day():
    resp = client.get("/v1/julian-day", params={"datetime": "2024-01-01T12:00:00Z"})
    assert resp.status_code == 200
    data = resp.json()
    assert "julian_day" in data
    assert isinstance(data["julian_day"], (int, float))


def test_ayanamsa():
    resp = client.get("/v1/ayanamsa", params={"datetime": "2024-01-01T12:00:00Z", "ayanamsa": 1})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("ayanamsa_id") == 1
    assert isinstance(data.get("ayanamsa"), (int, float))


def test_planets():
    resp = client.get(
        "/v1/planets",
        params={
            "datetime": "2024-01-01T12:00:00Z",
            "tropical": "false",
            "ayanamsa": 1,
            "node": "true",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("backend") in ("SWIEPH", "MOSEPH", "DEFAULT")
    planets = data.get("planets", {})
    # Expect Sun and Rahu/Ketu present
    assert "Sun" in planets
    assert "Rahu" in planets
    assert "Ketu" in planets
    assert isinstance(planets["Sun"].get("longitude"), (int, float))
    assert isinstance(planets["Rahu"].get("longitude"), (int, float))
    assert isinstance(planets["Ketu"].get("longitude"), (int, float))


def test_houses():
    resp = client.get(
        "/v1/houses",
        params={
            "datetime": "2024-01-01T12:00:00Z",
            "lat": 28.6139,
            "lon": 77.2090,
            "hsys": "P",
            "tropical": "false",
            "ayanamsa": 1,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("backend") in ("SWIEPH", "MOSEPH", "DEFAULT")
    houses = data.get("houses", {})
    assert "cusps" in houses and isinstance(houses["cusps"], list)
    assert "ascendant" in houses and isinstance(houses["ascendant"], (int, float))
    assert "mc" in houses and isinstance(houses["mc"], (int, float))

