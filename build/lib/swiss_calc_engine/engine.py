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


def _swe_calc(jd: float, body: int, flags: int) -> Tuple[List[float], int]:
    pos, ret = swe.calc_ut(jd, body, flags)
    if ret < 0:
        # Try Swiss Ephemeris file-based
        pos, ret = swe.calc_ut(jd, body, flags | swe.SEFLG_SWIEPH)
    if ret < 0:
        # Fall back to Moshier (no ephemeris files required)
        pos, ret = swe.calc_ut(jd, body, (flags & ~swe.SEFLG_SIDEREAL) | swe.SEFLG_MOSEPH)
    return pos, ret


def get_planetary_positions(jd: float, sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, dict]:
    """Compute planetary long/lat/dist and speeds. JSON-friendly dict keyed by planet name.

    If both lat and lon are provided, performs topocentric calculations using swe.set_topo
    and the SEFLG_TOPOCTR flag. Otherwise, defaults to geocentric.

    Parameters are stable for external imports.
    """
    if not hasattr(swe, "SEFLG_TOPOCTR"):
        swe.SEFLG_TOPOCTR = 32768  # type: ignore[attr-defined]
    flags = swe.SEFLG_SPEED
    if sidereal:
        flags |= swe.SEFLG_SIDEREAL
        swe.set_sid_mode(ayanamsa)
    if lat is not None and lon is not None:
        swe.set_topo(lon, lat, 0.0)
        flags |= swe.SEFLG_TOPOCTR

    result: Dict[str, dict] = {}
    for p in PLANETS:
        pos, ret = _swe_calc(jd, p, flags)
        if ret < 0:
            raise RuntimeError(f"Swiss Ephemeris calculation failed for planet {PLANET_NAMES.get(p, str(p))}")
        lon_v, lat_v, dist, spd_lon, spd_lat, spd_dist = pos
        result[PLANET_NAMES[p]] = {
            "longitude": float(lon_v),
            "latitude": float(lat_v),
            "distance": float(dist),
            "speed_longitude": float(spd_lon),
            "speed_latitude": float(spd_lat),
            "speed_distance": float(spd_dist),
            "is_retrograde": bool(spd_lon < 0),
        }
    return result


def get_house_cusps(jd: float, lat: float, lon: float, hsys: str = "P", sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI) -> dict:
    """Compute house cusps and angles. Returns JSON-friendly dict.

    hsys examples: 'P' Placidus, 'K' Koch, 'E' Equal, 'W' Whole Sign, etc.
    """
    if sidereal:
        swe.set_sid_mode(ayanamsa)
    # Swiss Ephemeris uses geographic longitude East positive; we assume lon East positive input
    cusps, ascmc = swe.houses(jd, lat, lon, hsys)
    return {
        "cusps": [float(c) for c in cusps],
        "ascendant": float(ascmc[0]),
        "mc": float(ascmc[1]),
        "vertex": float(ascmc[5]) if len(ascmc) > 5 else None,
    }


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

    data = {
        "julian_day": float(jd),
        "planets": get_planetary_positions(jd, sidereal=sidereal, ayanamsa=ayanamsa),
    }
    if include_houses:
        data["houses"] = get_house_cusps(jd, lat, lon, hsys=hsys, sidereal=sidereal, ayanamsa=ayanamsa)
    return data


