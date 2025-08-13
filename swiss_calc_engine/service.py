# Swiss Calculation Engine FastAPI Service
# Copyright (C) 2025 Richard Belll
# Licensed under the GNU AGPL v3.0 or later.
# This software uses the Swiss Ephemeris (c) Astrodienst AG under the AGPL v3 license.
# SPDX-License-Identifier: AGPL-3.0-only

from __future__ import annotations

import argparse
import os
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version as pkg_version

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .engine import (
    set_ephemeris_path,
    julian_day as jd_from_dt,
    get_planetary_positions,
    get_house_cusps,
)


API_PREFIX = "/v1"

app = FastAPI(
    title="Swiss Calculation Engine Service",
    version="1.0.0",
    description=(
        "HTTP API around Swiss Ephemeris returning raw JSON only. "
        "Endpoints: /v1/planets, /v1/houses, /v1/ayanamsa, /v1/julian-day."
    ),
)

REPO_URL = "https://github.com/richardbelll9/Swiss-Calculation-Engine"


def _service_version() -> str:
    try:
        return pkg_version("swiss-calc-engine")
    except PackageNotFoundError:
        return "dev"

# CORS: allow all origins by default (public API). You can restrict via env CORS_ORIGINS
origins_env = os.getenv("CORS_ORIGINS")  # comma-separated list
allow_origins = [o.strip() for o in origins_env.split(",")] if origins_env else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "Swiss Calculation Engine Service",
        "version": _service_version(),
        "source": REPO_URL,
        "endpoints": [
            f"{API_PREFIX}/julian-day",
            f"{API_PREFIX}/ayanamsa",
            f"{API_PREFIX}/planets",
            f"{API_PREFIX}/houses",
            "/health",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok", "version": _service_version()}


@app.on_event("startup")
def load_ephemeris_path() -> None:
    # Service reads EPHE_DIR from environment
    ephe_dir = os.getenv("EPHE_DIR")
    set_ephemeris_path(ephe_dir)


@app.get(f"{API_PREFIX}/julian-day")
async def api_julian_day(datetime: str = Query(..., description="ISO 8601 timestamp")):
    try:
        dt = _parse_dt(datetime)
        jd = jd_from_dt(dt)
        return {"julian_day": float(jd)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(f"{API_PREFIX}/ayanamsa")
async def api_ayanamsa(
    datetime: str = Query(..., description="ISO 8601 timestamp"),
    ayanamsa: int = Query(1, description="Swiss Ephemeris ayanamsa id; 1=Lahiri"),
):
    try:
        import swisseph as swe  # local import to keep module import light
        dt = _parse_dt(datetime)
        jd = jd_from_dt(dt)
        swe.set_sid_mode(ayanamsa)
        # SE_SIDM returned as longitude of ayanamsa at given jd
        val = swe.get_ayanamsa_ut(jd)
        return {"ayanamsa_id": int(ayanamsa), "ayanamsa": float(val)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(f"{API_PREFIX}/planets")
async def api_planets(
    datetime: str = Query(..., description="ISO 8601 timestamp"),
    tropical: bool = Query(False, description="Use tropical zodiac; default sidereal"),
    ayanamsa: int = Query(1, description="Swiss Ephemeris ayanamsa id; 1=Lahiri"),
    node: str = Query("true", description="'true' or 'mean' node for Rahu"),
    latitude: float | None = Query(None, description="Latitude in decimal degrees (north positive)"),
    longitude: float | None = Query(None, description="Longitude in decimal degrees (east positive)"),
):
    try:
        dt = _parse_dt(datetime)
        jd = jd_from_dt(dt)
        sidereal = not tropical
        # Compute all planets (Sun–Pluto, mean/true nodes); topocentric if both latitude/longitude provided
        planets, backend = get_planetary_positions(
            jd,
            sidereal=sidereal,
            ayanamsa=ayanamsa,
            lat=latitude if latitude is not None and longitude is not None else None,
            lon=longitude if latitude is not None and longitude is not None else None,
        )
        # Select Rahu as requested and compute Ketu = Rahu + 180
        rahu_key = "True Node" if node.lower() == "true" else "Mean Node"
        rahu = planets.get(rahu_key)
        if rahu is None:
            raise RuntimeError("Node computation failed")
        ketu_lon = (rahu["longitude"] + 180.0) % 360.0
        planets_out = {k: v for k, v in planets.items() if k not in ("True Node", "Mean Node")}
        planets_out["Rahu"] = rahu
        planets_out["Ketu"] = {"longitude": ketu_lon, "latitude": 0.0}
        return {
            "julian_day": float(jd),
            "tropical": bool(tropical),
            "ayanamsa_id": int(ayanamsa),
            "backend": backend,
            "planets": planets_out,
            "location_used": {
                "latitude": float(latitude) if latitude is not None else None,
                "longitude": float(longitude) if longitude is not None else None,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(f"{API_PREFIX}/houses")
async def api_houses(
    datetime: str = Query(..., description="ISO 8601 timestamp"),
    lat: float = Query(..., description="Latitude in decimal degrees"),
    lon: float = Query(..., description="Longitude in decimal degrees (East positive)"),
    hsys: str = Query("P", description="House system code, e.g., P, K, E, W"),
    tropical: bool = Query(False, description="Use tropical zodiac; default sidereal"),
    ayanamsa: int = Query(1, description="Swiss Ephemeris ayanamsa id; 1=Lahiri"),
):
    try:
        dt = _parse_dt(datetime)
        jd = jd_from_dt(dt)
        sidereal = not tropical
        houses, backend = get_house_cusps(jd, lat, lon, hsys=hsys, sidereal=sidereal, ayanamsa=ayanamsa)
        return {
            "julian_day": float(jd),
            "tropical": bool(tropical),
            "ayanamsa_id": int(ayanamsa),
            "backend": backend,
            "houses": houses,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _parse_dt(s: str) -> datetime:
    # Accepts ISO 8601; naive treated as UTC
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO 8601.")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def run(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run("swiss_calc_engine.service:app", host=host, port=port, reload=False)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Swiss Calculation Engine API Service")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind (default: 8000)")
    args = parser.parse_args(argv)

    # Ensure EPHE_DIR (service) or SWISS_EPHE_PATH (engine legacy) is set as needed.
    # We don't override here; startup hook reads EPHE_DIR and sets the engine path.
    uvicorn.run("swiss_calc_engine.service:app", host=args.host, port=args.port, reload=False)
    return 0

