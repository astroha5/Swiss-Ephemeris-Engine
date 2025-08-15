# Swiss Calculation Engine

A pure Python calculation engine and standalone HTTP API service using the Swiss Ephemeris.

🌟 **NEW: Fixed Critical Issues for Accurate Astrology Calculations**
- ✅ **Proper Sidereal Calculations** - Fixed ayanamsa correction for Vedic astrology
- ✅ **Timezone Awareness** - Handles local time to UTC conversion correctly
- ✅ **Verified Accuracy** - All major calculation bugs resolved

**🌐 Live API:** https://swiss-ephemeris-engine.onrender.com

## ⚠️ Critical for Accuracy

**For correct results, convert birth time to UTC before API calls:**
```bash
# Example: Birth in Kolkata (12:00 PM IST = 06:30 UTC)
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=22.5726&lon=88.3639&tropical=false"
# Returns: Sagittarius ascendant ✅
```

**📖 [Complete API Documentation](./API_DOCUMENTATION.md) | 🚀 [Quick Reference](./QUICK_REFERENCE.md)**

Important:
- Standalone service: interact only via HTTP API calls. Do not import this AGPL code directly into closed-source apps.
- No ephemeris files included: Swiss Ephemeris .se1 data files are not in this repo.
- Outputs raw JSON only; no interpretation.

This package provides accurate planetary positions, house cusps, ayanamsa adjustments, and retrograde flags as plain JSON-serializable data structures. No business logic, AI, UI, payment, or user management code is included.

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
No ephemeris files included in this repository.
Swiss Ephemeris `.se1` files are not included due to licensing. Download them from:
- https://www.astro.com/swisseph/
- https://github.com/aloistr/swisseph

Place the files in a directory (e.g., `ephemeris/`).

- For the HTTP API service, set the EPHE_DIR environment variable so the service can find them:
  - macOS/Linux (bash/zsh):
    ```bash
    export EPHE_DIR="$(pwd)/ephemeris"
    ```
  - Windows (PowerShell):
    ```powershell
    $env:EPHE_DIR = "$PWD/ephemeris"
    ```

- For the Python library/CLI, you can either set SWISS_EPHE_PATH (legacy env used by the engine), pass `--ephe_dir` to the CLI, or pass `ephe_dir` to the Python API.

Note on fallback: If `.se1` files are not available, the engine will automatically fall back to Moshier calculations (SEFLG_MOSEPH), which do not require ephemeris files but may be less precise than file-based Swiss Ephemeris.

## Usage

### Run the HTTP API Service
- Install dependencies:
  ```bash
  pip install .
  ```
- Set the ephemeris directory (no .se1 files are included in this repo):
  ```bash
  export EPHE_DIR="$(pwd)/ephemeris"  # macOS/Linux
  # or on Windows PowerShell
  # $env:EPHE_DIR = "$PWD/ephemeris"
  ```
- Optionally configure CORS for browser clients (default is open to all origins). To restrict:
  ```bash
  export CORS_ORIGINS="https://yourapp.com,https://another.app"
  ```
- Start the server (uvicorn):
  ```bash
  uvicorn swiss_calc_engine.service:app --host 0.0.0.0 --port 8000
  # or use the console script
  swiss-calc-api --host 0.0.0.0 --port 8000
  ```

Endpoints (all return raw JSON; no interpretation):
- GET /
  - Root metadata with name, version, and source link
- GET /health
  - Health status and version
- GET /v1/julian-day?datetime=2024-01-01T12:00:00Z
- GET /v1/ayanamsa?datetime=2024-01-01T12:00:00Zayanamsa=1  (default 1 = Lahiri)
- GET /v1/planets?datetime=2024-01-01T12:00:00Ztropical=falseayanamsa=1
  - Returns Sun–Pluto and Rahu (True Node); Ketu is computed as Rahu + 180°
  - Includes a backend field indicating SWIEPH (file-based Swiss), MOSEPH (Moshier fallback), or DEFAULT
- GET /v1/houses?datetime=2024-01-01T12:00:00Zlat=28.6139lon=77.2090hsys=Ptropical=falseayanamsa=1
  - Returns house cusps, ascendant, MC
  - Includes a backend field; houses use Swiss routines but depend only on time and location

Notes:
- The service reads EPHE_DIR on startup. If unset or files are missing, it falls back to Moshier when possible.
- Interaction is only via HTTP API; do not import AGPL code directly in closed-source apps.
- This is a standalone service intended to be consumed over HTTP.

### CLI Examples
- Installed entrypoint:
  ```bash
  swiss-calc \
    --datetime 2024-01-01T12:00:00 \
    --lat 28.6139 \
    --lon 77.2090 \
    --ephe_dir ./ephemeris \
    --houses
  ```
- Module invocation (without installation):
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

### Docker

Build and run with Docker (no ephemeris data bundled):

```bash
# Build image
docker build -t swiss-calc-engine:latest .

# Run with a local ephemeris directory mounted (optional)
# Replace ./ephemeris with your path containing .se1 files
docker run --rm -p 8000:8000 \
  -e EPHE_DIR=/ephe \
  -e CORS_ORIGINS="*" \
  -v "$(pwd)/ephemeris:/ephe:ro" \
  swiss-calc-engine:latest
```

Compose example:
```bash
docker compose up --build
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

Swiss Calculation Engine is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for details.

This software uses the Swiss Ephemeris © Astrodienst AG, available at https://www.astro.com/swisseph/ under the GNU AGPL v3 license.

Swiss Ephemeris data files (*.se1) are not included in this repository and must be downloaded separately from Astrodienst. If you modify Swiss Ephemeris source code (not typical when using the Python bindings), you must note those changes and keep them under the AGPL.

## Disclaimer
This engine is for astrological calculation purposes only. The Swiss Ephemeris is (c) Astrodienst AG and distributed under GPL terms. You must comply with their licensing for any use of the ephemeris data files.
