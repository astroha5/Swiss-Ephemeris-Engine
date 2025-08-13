# Swiss Calculation Engine

A pure Python calculation engine for astrological computations using the Swiss Ephemeris. This package provides accurate planetary positions, house cusps, ayanamsa adjustments, and retrograde flags as plain JSON-serializable data structures. No business logic, AI, UI, payment, or user management code is included.

## Features
- Loads Swiss Ephemeris `.se1` data files (not included; see below)
- Calculates planetary positions, house cusps, ayanamsa, and retrograde flags
- Returns results as JSON-serializable Python dicts/lists
- Minimal CLI and Python API for easy integration and testing

## Installation

1. Install the package dependencies:
   ```bash
   pip install pyswisseph
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/richardbelll9/Swiss-Calculation-Engine.git
   cd "Swiss Calculation Engine"
   ```
3. (Optional) Install as a package for import:
   ```bash
   pip install .
   ```
4. (Optional) Dev/test dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```

## Ephemeris Data Files
Swiss Ephemeris `.se1` files are not included due to licensing. Download them from:
- https://www.astro.com/swisseph/
- https://github.com/aloistr/swisseph

Place the files in a directory (e.g., `ephemeris/`). Then set the path using SWISS_EPHE_PATH (this is what the code reads):
- macOS/Linux (bash/zsh):
  ```bash
  export SWISS_EPHE_PATH="$(pwd)/ephemeris"
  ```
- Windows (PowerShell):
  ```powershell
  $env:SWISS_EPHE_PATH = "$PWD/ephemeris"
  ```
Alternatively, pass `--ephe_dir` to the CLI or `ephe_dir` to the Python API.

## Usage

### CLI Examples
- Sidereal (default), include houses:
  ```bash
  python -m swiss_calc_engine.cli \
    --datetime 2024-01-01T12:00:00 \
    --lat 28.6139 \
    --lon 77.2090 \
    --ephe_dir ./ephemeris \
    --houses
  ```
- Tropical, Placidus houses:
  ```bash
  python -m swiss_calc_engine.cli \
    --datetime 2024-01-01T12:00:00 \
    --lat 28.6139 \
    --lon 77.2090 \
    --ephe_dir ./ephemeris \
    --tropical \
    --houses \
    --hsys P
  ```

### Run tests
- Quick run (no ephemeris required; ephemeris-dependent tests auto-skip):
  ```bash
  pip install -r requirements-dev.txt
  python -m pytest -q
  ```

### Python Examples
- Low-level API:
  ```python
  from swiss_calc_engine import set_ephemeris_path, julian_day, get_planetary_positions, get_house_cusps
  from datetime import datetime

  set_ephemeris_path('./ephemeris')
  dt = datetime(2024, 1, 1, 12, 0, 0)
  jd = julian_day(dt)
  planets = get_planetary_positions(jd)
  houses = get_house_cusps(jd, 28.6139, 77.2090)
  print(planets)
  print(houses)
  ```
- High-level one-call API for seamless integration:
  ```python
  from swiss_calc_engine import compute_positions
  from datetime import datetime

  result = compute_positions(
      dt=datetime(2024, 1, 1, 12, 0, 0),
      lat=28.6139,
      lon=77.2090,
      ephe_dir='./ephemeris',
      tropical=False,
      include_houses=True,
      hsys='P',
  )
  # result is a JSON-serializable dict
  ```

### Example JSON Output (truncated)
```json
{
  "julian_day": 2460311.0,
  "planets": {
    "Sun": {"longitude": 255.12, "latitude": -0.00, "distance": 0.983, "speed_longitude": 0.98, "speed_latitude": 0.0, "is_retrograde": false},
    "Moon": {"longitude": 101.45, "latitude": 5.12, "distance": 0.0026, "speed_longitude": 13.2, "speed_latitude": -0.1, "is_retrograde": false}
  },
  "houses": {"cusps": [ ... ], "ascendant": 123.45, "mc": 210.67, "vertex": 300.12}
}
```

## License
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for details. Use of the Swiss Ephemeris data files requires compliance with the Swiss Ephemeris license from Astrodienst AG.

## Disclaimer
This engine is for astrological calculation purposes only. The Swiss Ephemeris is (c) Astrodienst AG and distributed under GPL terms. You must comply with their licensing for any use of the ephemeris data files.
