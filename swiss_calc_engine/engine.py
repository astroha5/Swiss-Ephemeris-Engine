# Swiss Calculation Engine
# Copyright (C) 2025 Richard Belll
# Licensed under the GNU AGPL v3.0 or later.
# This software uses the Swiss Ephemeris (c) Astrodienst AG under the AGPL v3 license.
# SPDX-License-Identifier: AGPL-3.0-only
# Core Swiss Ephemeris calculations
# No business logic, AI, or UI. JSON-friendly outputs only.

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

try:
    import swisseph as swe  # type: ignore
except Exception as e:  # pragma: no cover
    raise ImportError(
        "pyswisseph (swisseph) is required. Install with `pip install pyswisseph`."
    ) from e

# Fallbacks for missing Swiss Ephemeris flag constants (seen on some builds/environments)
# Values are taken from the Swiss Ephemeris C headers.
if not hasattr(swe, "SEFLG_SPEED"):
    swe.SEFLG_SPEED = 256  # type: ignore[attr-defined]
if not hasattr(swe, "SEFLG_SIDEREAL"):
    swe.SEFLG_SIDEREAL = 65536  # type: ignore[attr-defined]


PLANETS = [
    swe.SUN,
    swe.MOON,
    swe.MERCURY,
    swe.VENUS,
    swe.MARS,
    swe.JUPITER,
    swe.SATURN,
    swe.URANUS,
    swe.NEPTUNE,
    swe.PLUTO,
    swe.MEAN_NODE,
    swe.TRUE_NODE,
]

PLANET_NAMES = {
    swe.SUN: "Sun",
    swe.MOON: "Moon",
    swe.MERCURY: "Mercury",
    swe.VENUS: "Venus",
    swe.MARS: "Mars",
    swe.JUPITER: "Jupiter",
    swe.SATURN: "Saturn",
    swe.URANUS: "Uranus",
    swe.NEPTUNE: "Neptune",
    swe.PLUTO: "Pluto",
    swe.MEAN_NODE: "Mean Node",
    swe.TRUE_NODE: "True Node",
}


def set_ephemeris_path(path: Optional[str] = None) -> None:
    """Set Swiss Ephemeris data directory.

    Order of precedence:
    - explicit path
    - SWISS_EPHE_PATH environment variable
    - current working directory (fallback)
    """
    ephe = path or os.getenv("SWISS_EPHE_PATH") or os.getcwd()
    swe.set_ephe_path(ephe)


def julian_day(dt: datetime) -> float:
    """Return UT1 Julian Day for a timezone-aware or naive datetime (assumed UTC).

    The function is stable and safe to import by host apps.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc)
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute / 60 + dt_utc.second / 3600)


def _swe_calc(jd: float, body: int, flags: int) -> Tuple[List[float], int, str]:
    backend = "DEFAULT"
    pos, ret = swe.calc_ut(jd, body, flags)
    if ret < 0:
        # Try Swiss Ephemeris file-based
        pos, ret = swe.calc_ut(jd, body, flags | swe.SEFLG_SWIEPH)
        backend = "SWIEPH" if ret >= 0 else backend
    else:
        backend = "SWIEPH"  # normal Swiss path
    if ret < 0:
        # Fall back to Moshier (no ephemeris files required)
        pos, ret = swe.calc_ut(jd, body, (flags & ~swe.SEFLG_SIDEREAL) | swe.SEFLG_MOSEPH)
        backend = "MOSEPH" if ret >= 0 else backend
    return pos, ret, backend


def get_planetary_positions(jd: float, sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI) -> Tuple[Dict[str, dict], str]:
    """Compute planetary long/lat/dist and speeds. Returns (result, backend).

    Backend is one of: SWIEPH (file-based Swiss), MOSEPH (Moshier fallback), DEFAULT.
    """
    flags = swe.SEFLG_SPEED
    if sidereal:
        flags |= swe.SEFLG_SIDEREAL
        swe.set_sid_mode(ayanamsa)

    result: Dict[str, dict] = {}
    backends: List[str] = []
    for p in PLANETS:
        pos, ret, backend = _swe_calc(jd, p, flags)
        if ret < 0:
            raise RuntimeError(f"Swiss Ephemeris calculation failed for planet {PLANET_NAMES.get(p, str(p))}")
        backends.append(backend)
        lon, lat, dist, spd_lon, spd_lat, spd_dist = pos
        result[PLANET_NAMES[p]] = {
            "longitude": float(lon),
            "latitude": float(lat),
            "distance": float(dist),
            "speed_longitude": float(spd_lon),
            "speed_latitude": float(spd_lat),
            "speed_distance": float(spd_dist),
            "is_retrograde": bool(spd_lon < 0),
        }
    # Prefer SWIEPH if any used it, else MOSEPH if any used it, else DEFAULT
    backend_overall = "SWIEPH" if "SWIEPH" in backends else ("MOSEPH" if "MOSEPH" in backends else "DEFAULT")
    return result, backend_overall

def get_house_cusps(jd: float, lat: float, lon: float, hsys: str = "P", sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI) -> Tuple[dict, str]:
    """Compute house cusps and angles. Returns (dict, backend)."""
    if sidereal:
        swe.set_sid_mode(ayanamsa)
    # Swiss Ephemeris uses geographic longitude East positive; we assume lon East positive input
    # houses() uses current ephemeris; we consider it SWIEPH if files are set, otherwise MOSEPH is still possible for planets but houses rely on time/place only.
    cusps, ascmc = swe.houses(jd, lat, lon, hsys)
    data = {
        "cusps": [float(c) for c in cusps],
        "ascendant": float(ascmc[0]),
        "mc": float(ascmc[1]),
        "vertex": float(ascmc[5]) if len(ascmc) > 5 else None,
    }
    # Backend heuristic: if ephemeris path is set to something other than cwd, assume SWIEPH; otherwise DEFAULT.
    backend = "SWIEPH" if os.getenv("EPHE_DIR") or os.getenv("SWISS_EPHE_PATH") else "DEFAULT"
    return data, backend

def compute_positions(
    dt: datetime,
    lat: float,
    lon: float,
    ephe_dir: Optional[str] = None,
    tropical: bool = False,
    include_houses: bool = True,
    hsys: str = "P",
    ayanamsa: int = swe.SIDM_LAHIRI,
) -> dict:
    """High-level one-call API. Returns JSON-serializable dict.

    This function is stable for external apps to import.
    """
    set_ephemeris_path(ephe_dir)
    jd = julian_day(dt)
    sidereal = not tropical

    planets, backend_planets = get_planetary_positions(jd, sidereal=sidereal, ayanamsa=ayanamsa)
    data = {
        "julian_day": float(jd),
        "planets": planets,
        "backend": backend_planets,
    }
    if include_houses:
        houses, backend_houses = get_house_cusps(jd, lat, lon, hsys=hsys, sidereal=sidereal, ayanamsa=ayanamsa)
        data["houses"] = houses
        if backend_houses != "DEFAULT":
            data.setdefault("backend_details", {})["houses"] = backend_houses
    return data


