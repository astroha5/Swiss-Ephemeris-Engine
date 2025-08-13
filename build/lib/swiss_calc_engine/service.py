# Swiss Calculation Engine FastAPI Service
# Copyright (C) 2025 Richard Belll
# Licensed under the GNU AGPL v3.0 or later.
# This software uses the Swiss Ephemeris (c) Astrodienst AG under the AGPL v3 license.
# SPDX-License-Identifier: AGPL-3.0-only

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
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


# Models for request parsing (responses are raw dicts by design)
class DateTimeParam(BaseModel):
    datetime: datetime = Field(..., description="ISO 8601 datetime; if naive, assumed UTC")


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
    lat: float | None = Query(None, description="Latitude in decimal degrees (north positive)", alias="latitude"),
    lon: float | None = Query(None, description="Longitude in decimal degrees (east positive)", alias="longitude"),
):
    try:
        import swisseph as swe
        dt = _parse_dt(datetime)
        jd = jd_from_dt(dt)
        sidereal = not tropical
        # Pick true vs mean node label to return
        planets = get_planetary_positions(
            jd,
            sidereal=sidereal,
            ayanamsa=ayanamsa,
            lat=lat if lat is not None and lon is not None else None,
            lon=lon if lat is not None and lon is not None else None,
        )
        # Select Rahu as requested and compute Ketu = Rahu + 180
        rahu_key = "True Node" if node.lower() == "true" else "Mean Node"
        rahu = planets.get(rahu_key) if isinstance(planets, dict) else planets[0].get(rahu_key)
        # Normalize planets output regardless of engine version in build/lib
        planets_dict = planets if isinstance(planets, dict) else planets[0]
        if rahu is None:
            raise RuntimeError("Node computation failed")
        ketu_lon = (rahu["longitude"] + 180.0) % 360.0
        planets_out = {k: v for k, v in planets_dict.items() if k not in ("True Node", "Mean Node")}
        planets_out["Rahu"] = rahu
        planets_out["Ketu"] = {"longitude": ketu_lon, "latitude": 0.0}
        return {
            "julian_day": float(jd),
            "tropical": bool(tropical),
            "ayanamsa_id": int(ayanamsa),
            "planets": planets_out,
            "location_used": {
                "latitude": float(lat) if lat is not None else None,
                "longitude": float(lon) if lon is not None else None,
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
        houses = get_house_cusps(jd, lat, lon, hsys=hsys, sidereal=sidereal, ayanamsa=ayanamsa)
        return {
            "julian_day": float(jd),
            "tropical": bool(tropical),
            "ayanamsa_id": int(ayanamsa),
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

