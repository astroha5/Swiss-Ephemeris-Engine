#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
import pytz # pytz is more common than timezonefinder

def get_house_cusps_fixed(
    dt: datetime,
    lat: float,
    lon: float,
    hsys: str = "P",
    tropical: bool = False,
    ayanamsa: int = 1, # Lahiri
    assume_local_time: bool = True,
):
    """Standalone function with all fixes and timezone logic included."""
    import swisseph as swe

    # 1. Timezone correction
    if assume_local_time and dt.tzinfo is None:
        # Estimate UTC offset from longitude
        # This is not perfect but better than nothing without timezonefinder
        offset_hours = lon / 15.0
        offset_seconds = offset_hours * 3600
        tz_offset = timedelta(seconds=offset_seconds)
        dt = dt - tz_offset
        dt = dt.replace(tzinfo=timezone.utc)
        print(f"Estimated UTC offset: {tz_offset}")
        print(f"Corrected UTC time: {dt}")
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # 2. Julian day calculation
    dt_utc = dt.astimezone(timezone.utc)
    jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute/60 + dt_utc.second/3600)
    
    # 3. Sidereal correction (ayanamsa)
    swe.set_sid_mode(ayanamsa)
    
    # 4. hsys encoding
    hsys_byte = hsys[0].encode('ascii')
    
    cusps, ascmc = swe.houses(jd, lat, lon, hsys_byte)
    
    if not tropical:
        ayanamsa_val = swe.get_ayanamsa_ut(jd)
        ascmc = [(a - ayanamsa_val) % 360 for a in ascmc]
    
    return ascmc[0]


# Test with Kolkata time
dt_local = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5726459
lon = 88.3638953

asc = get_house_cusps_fixed(dt_local, lat, lon, tropical=False)

signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
sign_idx = int(asc / 30)

print(f"\nFinal Result: {signs[sign_idx]} {asc % 30:.2f}° ({asc:.2f}°)")
if signs[sign_idx] == "Sagittarius":
    print("✅ CORRECT!")

