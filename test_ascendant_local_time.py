#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from swiss_calc_engine.engine import compute_positions

# Test with the provided details - interpreting time as local time
dt_local = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5726459
lon = 88.3638953

print("Testing ascendant calculation with local time interpretation...")
print(f"Local Date/Time: {dt_local}")
print(f"Location: {lat}°N, {lon}°E (Kolkata, India)")
print()

# Convert to UTC assuming this was local time in Kolkata (UTC+5:30)
kolkata_offset = timedelta(hours=5, minutes=30)
dt_utc = dt_local - kolkata_offset  # Convert local to UTC
dt_utc = dt_utc.replace(tzinfo=timezone.utc)

print(f"Interpreted as Kolkata local time")
print(f"Equivalent UTC time: {dt_utc}")
print()

try:
    # Calculate with the UTC-corrected time
    result = compute_positions(
        dt=dt_utc,
        lat=lat,
        lon=lon,
        include_houses=True,
        tropical=False,  # Use sidereal (Vedic)
    )
    
    ascendant = result['houses']['ascendant']
    print(f"Ascendant (sidereal): {ascendant}°")
    
    # Convert to zodiac sign
    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
             "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    
    sign_index = int(ascendant / 30)
    degree_in_sign = ascendant % 30
    sign_name = signs[sign_index % 12]
    
    print(f"Ascendant Sign: {sign_name}")
    print(f"Degree: {degree_in_sign:.2f}°")
    
    # Also show tropical for comparison
    result_tropical = compute_positions(
        dt=dt_utc,
        lat=lat,
        lon=lon,
        include_houses=True,
        tropical=True,
    )
    
    ascendant_tropical = result_tropical['houses']['ascendant']
    print(f"\nAscendant (tropical): {ascendant_tropical}°")
    
    sign_index_tropical = int(ascendant_tropical / 30)
    degree_in_sign_tropical = ascendant_tropical % 30
    sign_name_tropical = signs[sign_index_tropical % 12]
    
    print(f"Tropical Ascendant Sign: {sign_name_tropical}")
    print(f"Degree: {degree_in_sign_tropical:.2f}°")
    
    print(f"\n✅ Expected: Sagittarius")
    print(f"✅ Got: {sign_name}")
    if sign_name == "Sagittarius":
        print("✅ CORRECT!")
    else:
        print("❌ Still incorrect")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
