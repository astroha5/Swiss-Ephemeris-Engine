# Swiss Calculation Engine
# Copyright (C) 2025 Richard Belll
# Licensed under the GNU AGPL v3.0 or later.
# This software uses the Swiss Ephemeris (c) Astrodienst AG under the AGPL v3 license.
# SPDX-License-Identifier: AGPL-3.0-only
# Simple CLI wrapper around the engine that prints JSON

from __future__ import annotations

import argparse
import json
from datetime import datetime
from typing import Optional

from .engine import compute_positions


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Swiss Calculation Engine CLI")
    p.add_argument("--datetime", required=True, help="ISO datetime in UTC, e.g. 2024-01-01T12:00:00")
    p.add_argument("--lat", type=float, required=True, help="Latitude in decimal degrees")
    p.add_argument("--lon", type=float, required=True, help="Longitude in decimal degrees (East positive)")
    p.add_argument("--ephe_dir", default=None, help="Directory containing Swiss Ephemeris .se1 files")
    p.add_argument("--tropical", action="store_true", help="Use tropical zodiac (default: sidereal)")
    p.add_argument("--houses", action="store_true", help="Include house cusps and angles")
    p.add_argument("--hsys", default="P", help="House system code (default: P - Placidus)")
    return p


def main(argv: Optional[list[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    dt = datetime.fromisoformat(args.datetime)

    result = compute_positions(
        dt=dt,
        lat=args.lat,
        lon=args.lon,
        ephe_dir=args.ephe_dir,
        tropical=args.tropical,
        include_houses=args.houses,
        hsys=args.hsys,
    )

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())

