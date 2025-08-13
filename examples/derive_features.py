# Example: derive app-level fields from engine JSON
# Usage:
#   python examples/derive_features.py \
#     --datetime 2024-01-01T12:00:00 --lat 28.6139 --lon 77.2090 --ephe_dir ./ephemeris

import argparse
import json
import math
from datetime import datetime
from swiss_calc_engine import compute_positions


def norm360(x: float) -> float:
    return x % 360.0


def sign_index(lon: float) -> int:
    return int(math.floor(norm360(lon) / 30.0))


def deg_in_sign(lon: float) -> float:
    return norm360(lon) % 30.0


NAK_SIZE = 13.0 + 20.0 / 60.0


def nakshatra_idx(lon_sid: float) -> int:
    Ls = norm360(lon_sid)
    return int(math.floor(Ls / NAK_SIZE))


def pada_from_lon(lon_sid: float) -> int:
    Ls = norm360(lon_sid)
    pos_in_nak = Ls % NAK_SIZE
    return int(math.floor((pos_in_nak / NAK_SIZE) * 4.0)) + 1


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--datetime", required=True)
    p.add_argument("--lat", type=float, required=True)
    p.add_argument("--lon", type=float, required=True)
    p.add_argument("--ephe_dir", required=True)
    p.add_argument("--tropical", action="store_true")
    args = p.parse_args()

    dt = datetime.fromisoformat(args.datetime)
    res = compute_positions(
        dt=dt,
        lat=args.lat,
        lon=args.lon,
        ephe_dir=args.ephe_dir,
        tropical=args.tropical,
        include_houses=True,
        hsys="P",
    )

    sun_lon = res["planets"]["Sun"]["longitude"]
    moon_lon = res["planets"]["Moon"]["longitude"]
    asc_lon = res["houses"]["ascendant"]

    derived = {
        "julian_day": res["julian_day"],
        "sun": {
            "lon": sun_lon,
            "sign_index": sign_index(sun_lon),
            "deg_in_sign": round(deg_in_sign(sun_lon), 6),
        },
        "moon": {
            "lon": moon_lon,
            "nakshatra_idx": nakshatra_idx(moon_lon),
            "pada": pada_from_lon(moon_lon),
        },
        "ascendant": {
            "lon": asc_lon,
            "sign_index": sign_index(asc_lon),
            "deg_in_sign": round(deg_in_sign(asc_lon), 6),
        },
    }
    print(json.dumps(derived, indent=2))

