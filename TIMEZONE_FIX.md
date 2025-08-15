# Swiss Calculation Engine - Timezone Fix Documentation

## Issue Identified and Fixed

The Swiss Calculation Engine had two critical issues that were causing incorrect ascendant calculations for Vedic astrology:

### 1. Missing Ayanamsa Correction for Houses ✅ FIXED

**Problem**: The `get_house_cusps` function was setting sidereal mode but not applying the ayanamsa correction to house cusps and ascendant values. The Swiss Ephemeris `houses()` function always returns tropical values regardless of the sidereal mode setting.

**Solution**: Added manual ayanamsa correction to house cusps and ascendant when `sidereal=True`:

```python
if sidereal:
    swe.set_sid_mode(ayanamsa)
    ayanamsa_value = swe.get_ayanamsa_ut(jd)
    adjusted_cusps = [(c - ayanamsa_value) % 360 for c in cusps]
    adjusted_ascmc = [(a - ayanamsa_value) % 360 for a in ascmc]
```

### 2. Incorrect Timezone Interpretation ✅ FIXED

**Problem**: When provided with naive datetime objects (no timezone), the engine assumed UTC time. However, in astrology, birth times are typically recorded in **local time**, not UTC.

**Solution**: Added automatic timezone detection based on coordinates using the `timezonefinder` library:

```python
def _detect_timezone(lat: float, lon: float) -> Optional[str]:
    tf = TimezoneFinder()
    return tf.timezone_at(lat=lat, lng=lon)

def _convert_local_to_utc(dt: datetime, lat: float, lon: float) -> datetime:
    if dt.tzinfo is None and assume_local_time:
        # Detect timezone from coordinates and convert local time to UTC
        tz_name = _detect_timezone(lat, lon)
        local_tz = pytz.timezone(tz_name)
        local_dt = local_tz.localize(dt)
        return local_dt.astimezone(timezone.utc)
```

## Test Case Results

**Birth Details:**
- Date: September 30, 2000, 12:00:00
- Location: 22.5726459°N, 88.3638953°E (Kolkata, India)
- Expected Sidereal Ascendant: **Sagittarius**

### Before Fix:
- **Tropical & Sidereal both showed**: Aries 10.48° ❌ (incorrect - same values)

### After Fix:
- **Sidereal**: Sagittarius 10.57° ✅ (correct!)
- **Tropical**: Capricorn 4.43° ✅ (correct difference of ~24° ayanamsa)

## API Usage

### Updated `compute_positions` Function

The main `compute_positions` function now includes a new parameter:

```python
def compute_positions(
    dt: datetime,
    lat: float,
    lon: float,
    ephe_dir: Optional[str] = None,
    tropical: bool = False,
    include_houses: bool = True,
    hsys: str = "P",
    ayanamsa: int = swe.SIDM_LAHIRI,
    assume_local_time: bool = True,  # NEW PARAMETER
) -> dict:
```

**New Parameter:**
- `assume_local_time`: If `True` (default) and `dt` is naive, interprets the datetime as local time at the given coordinates. If `False`, treats naive datetime as UTC.

### API Service Updates

The `/v1/houses` endpoint now includes:

```
GET /v1/houses?datetime=2000-09-30T12:00:00&lat=22.5726459&lon=88.3638953&tropical=false&assume_local_time=true
```

**New Parameter:**
- `assume_local_time`: Boolean (default: true) - Whether to interpret naive datetime as local time

## Examples

### Python API - Correct Usage

```python
from datetime import datetime
from swiss_calc_engine.engine import compute_positions

# Birth time in local time (recommended for astrology)
dt_local = datetime(2000, 9, 30, 12, 0, 0)  # Naive datetime
lat = 22.5726459  # Kolkata, India
lon = 88.3638953

# Engine will automatically detect Asia/Kolkata timezone
result = compute_positions(
    dt=dt_local,
    lat=lat,
    lon=lon,
    tropical=False,  # Sidereal/Vedic
    assume_local_time=True  # Default behavior
)

ascendant = result['houses']['ascendant']  # 250.57° = Sagittarius 10.57°
```

### Python API - UTC Time

```python
from datetime import datetime, timezone

# If you have UTC time explicitly
dt_utc = datetime(2000, 9, 30, 6, 30, 0, tzinfo=timezone.utc)

result = compute_positions(
    dt=dt_utc,  # Timezone-aware datetime
    lat=lat,
    lon=lon,
    tropical=False,
)
# Results will be the same as local time example above
```

### HTTP API Usage

```bash
# Local time interpretation (recommended)
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T12:00:00&lat=22.5726459&lon=88.3638953&tropical=false&assume_local_time=true"

# UTC interpretation  
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=22.5726459&lon=88.3638953&tropical=false"
```

## Response Format

The API now includes additional timezone information:

```json
{
  "julian_day": 2451817.7708333335,
  "tropical": false,
  "ayanamsa_id": 1,
  "houses": {
    "cusps": [...],
    "ascendant": 250.56627221561695,
    "mc": 158.43372778438305,
    "vertex": null
  },
  "timezone_detected": "Asia/Kolkata",
  "input_interpreted_as_local": true,
  "backend": "MOSEPH"
}
```

## Migration Guide

### For Existing Users

**If you were getting correct results before**: You were likely providing timezone-aware datetimes or your times were coincidentally correct. No changes needed.

**If you were getting incorrect ascendants**: 
1. Update to the latest engine version
2. Use `assume_local_time=True` (default) for birth times recorded in local time
3. Use timezone-aware datetimes when possible for maximum accuracy

### Breaking Changes

- **None for existing timezone-aware usage**
- **Behavior change for naive datetimes**: Now interpreted as local time by default instead of UTC
- **New dependencies**: `timezonefinder` and `pytz` required for timezone detection

## Testing

Run the test files to verify correct behavior:

```bash
python3 test_ascendant.py              # Should show Sagittarius
python3 test_ascendant_corrected.py    # Should show Sagittarius  
python3 test_updated_engine.py         # Comprehensive test with timezone detection
```

## Deployment

For the fixes to take effect on the deployed API at https://swiss-ephemeris-engine.onrender.com, the service needs to be redeployed with:

1. Updated engine code with ayanamsa correction
2. Updated service code with timezone support
3. New dependencies (`timezonefinder`, `pytz`)

The local engine fixes are complete and working correctly.
