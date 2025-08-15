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

try:
    from timezonefinder import TimezoneFinder
    import pytz
    _TIMEZONE_SUPPORT = True
except ImportError:  # pragma: no cover
    _TIMEZONE_SUPPORT = False

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


def _detect_timezone(lat: float, lon: float) -> Optional[str]:
    """Detect timezone from coordinates using timezonefinder.
    
    Returns timezone name (e.g., 'Asia/Kolkata') or None if detection fails.
    """
    if not _TIMEZONE_SUPPORT:
        return None
    
    try:
        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=lat, lng=lon)
        return tz_name
    except Exception:
        return None


def _convert_local_to_utc(dt: datetime, lat: float, lon: float) -> datetime:
    """Convert naive datetime from local time to UTC based on coordinates.
    
    If timezone detection fails, returns datetime as-is (assumed UTC).
    """
    if dt.tzinfo is not None:
        # Already timezone-aware, convert to UTC
        return dt.astimezone(timezone.utc)
    
    if not _TIMEZONE_SUPPORT:
        # No timezone support, assume UTC
        return dt.replace(tzinfo=timezone.utc)
    
    tz_name = _detect_timezone(lat, lon)
    if tz_name is None:
        # Could not detect timezone, assume UTC
        return dt.replace(tzinfo=timezone.utc)
    
    try:
        # Convert from local time to UTC
        local_tz = pytz.timezone(tz_name)
        local_dt = local_tz.localize(dt)
        return local_dt.astimezone(timezone.utc)
    except Exception:
        # Fallback to UTC if conversion fails
        return dt.replace(tzinfo=timezone.utc)


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


def get_planetary_positions(
    jd: float,
    sidereal: bool = True,
    ayanamsa: int = swe.SIDM_LAHIRI,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> Tuple[Dict[str, dict], str]:
    """Compute planetary long/lat/dist and speeds. Returns (result, backend).

    If both lat and lon are provided, performs topocentric calculations using swe.set_topo
    and the SEFLG_TOPOCTR flag. Otherwise, defaults to geocentric.

    Backend is one of: SWIEPH (file-based Swiss), MOSEPH (Moshier fallback), DEFAULT.
    """
    # Ensure required flags exist on some environments
    if not hasattr(swe, "SEFLG_TOPOCTR"):
        swe.SEFLG_TOPOCTR = 32768  # type: ignore[attr-defined]
    flags = swe.SEFLG_SPEED
    if sidereal:
        flags |= swe.SEFLG_SIDEREAL
        swe.set_sid_mode(ayanamsa)
    # Only enable topocentric if both coordinates are provided
    if lat is not None and lon is not None:
        swe.set_topo(lon, lat, 0.0)
        flags |= swe.SEFLG_TOPOCTR

    result: Dict[str, dict] = {}
    backends: List[str] = []
    for p in PLANETS:
        pos, ret, backend = _swe_calc(jd, p, flags)
        if ret < 0:
            raise RuntimeError(f"Swiss Ephemeris calculation failed for planet {PLANET_NAMES.get(p, str(p))}")
        backends.append(backend)
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
    # Prefer SWIEPH if any used it, else MOSEPH if any used it, else DEFAULT
    backend_overall = "SWIEPH" if "SWIEPH" in backends else ("MOSEPH" if "MOSEPH" in backends else "DEFAULT")
    return result, backend_overall

def get_house_cusps(jd: float, lat: float, lon: float, hsys: str = "P", sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI) -> Tuple[dict, str]:
    """Compute house cusps and angles. Returns (dict, backend)."""
    # Swiss Ephemeris uses geographic longitude East positive; we assume lon East positive input
    # houses() uses current ephemeris; we consider it SWIEPH if files are set, otherwise MOSEPH is still possible for planets but houses rely on time/place only.
    
    # Ensure hsys is properly encoded as bytes for Swiss Ephemeris
    # Swiss Ephemeris houses() expects bytes of length 1
    if isinstance(hsys, str):
        if len(hsys) == 0:
            hsys = "P"  # Default fallback
        hsys_byte = hsys[0].encode('ascii')  # Take first character and encode as ASCII
    elif isinstance(hsys, bytes):
        hsys_byte = hsys[:1]  # Take first byte
    else:
        hsys_byte = b'P'  # Default fallback
    
    cusps, ascmc = swe.houses(jd, lat, lon, hsys_byte)
    
    # The houses() function doesn't automatically apply sidereal correction
    # We need to manually adjust if sidereal mode is requested
    if sidereal:
        # Set sidereal mode to calculate ayanamsa
        swe.set_sid_mode(ayanamsa)
        # Get ayanamsa value for the given Julian day
        ayanamsa_value = swe.get_ayanamsa_ut(jd)
        
        # Apply ayanamsa correction to all values
        adjusted_cusps = [(c - ayanamsa_value) % 360 for c in cusps]
        adjusted_ascmc = [(a - ayanamsa_value) % 360 for a in ascmc]
        
        data = {
            "cusps": [float(c) for c in adjusted_cusps],
            "ascendant": float(adjusted_ascmc[0]),
            "mc": float(adjusted_ascmc[1]),
            "vertex": float(adjusted_ascmc[5]) if len(adjusted_ascmc) > 5 else None,
        }
    else:
        # For tropical, no adjustment needed
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
    assume_local_time: bool = True,
) -> dict:
    """High-level one-call API. Returns JSON-serializable dict.

    This function is stable for external apps to import.
    
    Parameters:
        dt: datetime object. If naive (no timezone), interpreted based on assume_local_time.
        lat: Latitude in decimal degrees.
        lon: Longitude in decimal degrees.
        ephe_dir: Path to ephemeris files.
        tropical: If True, use tropical zodiac. If False, use sidereal.
        include_houses: Include house cusps and angles.
        hsys: House system ('P' for Placidus, 'K' for Koch, etc.)
        ayanamsa: Ayanamsa mode for sidereal calculations.
        assume_local_time: If True and dt is naive, interpret as local time at lat/lon.
                          If False, interpret as UTC.
    """
    set_ephemeris_path(ephe_dir)
    
    # Handle timezone conversion for naive datetimes
    if dt.tzinfo is None and assume_local_time:
        dt_utc = _convert_local_to_utc(dt, lat, lon)
        detected_tz = _detect_timezone(lat, lon)
    else:
        dt_utc = dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
        detected_tz = None
    
    jd = julian_day(dt_utc)
    sidereal = not tropical

    planets, backend_planets = get_planetary_positions(jd, sidereal=sidereal, ayanamsa=ayanamsa)
    data = {
        "julian_day": float(jd),
        "planets": planets,
        "backend": backend_planets,
    }
    
    # Add timezone information if detected
    if detected_tz:
        data["timezone_detected"] = detected_tz
        data["input_interpreted_as_local"] = True
    elif dt.tzinfo is None and not assume_local_time:
        data["input_interpreted_as_local"] = False
    
    if include_houses:
        houses, backend_houses = get_house_cusps(jd, lat, lon, hsys=hsys, sidereal=sidereal, ayanamsa=ayanamsa)
        data["houses"] = houses
        if backend_houses != "DEFAULT":
            data.setdefault("backend_details", {})["houses"] = backend_houses
    return data
