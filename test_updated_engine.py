#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from swiss_calc_engine.engine import compute_positions

# Test with the provided details - should now automatically detect timezone
dt = datetime(2000, 9, 30, 12, 0, 0)  # Naive datetime
lat = 22.5726459
lon = 88.3638953

print("Testing updated engine with automatic timezone detection...")
print(f"Date/Time: {dt} (naive)")
print(f"Location: {lat}°N, {lon}°E (Kolkata, India)")
print()

try:
    # Test 1: Default behavior (assume_local_time=True by default)
    print("=== Test 1: Default behavior (local time interpretation) ===")
    result = compute_positions(
        dt=dt,
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
    
    # Show timezone detection info
    if 'timezone_detected' in result:
        print(f"Detected timezone: {result['timezone_detected']}")
    if 'input_interpreted_as_local' in result:
        print(f"Input interpreted as local time: {result['input_interpreted_as_local']}")
    
    print(f"Expected: Sagittarius")
    print(f"Got: {sign_name}")
    if sign_name == "Sagittarius":
        print("✅ CORRECT!")
    else:
        print("❌ Still incorrect")
    
    # Test 2: Force UTC interpretation 
    print("\n=== Test 2: Force UTC interpretation (assume_local_time=False) ===")
    result_utc = compute_positions(
        dt=dt,
        lat=lat,
        lon=lon,
        include_houses=True,
        tropical=False,  # Use sidereal (Vedic)
        assume_local_time=False
    )
    
    ascendant_utc = result_utc['houses']['ascendant']
    sign_index_utc = int(ascendant_utc / 30)
    degree_in_sign_utc = ascendant_utc % 30
    sign_name_utc = signs[sign_index_utc % 12]
    
    print(f"Ascendant (UTC interpretation): {sign_name_utc} {degree_in_sign_utc:.2f}° ({ascendant_utc:.2f}°)")
    
    # Test 3: Also show tropical for comparison
    print("\n=== Test 3: Tropical comparison ===")
    result_tropical = compute_positions(
        dt=dt,
        lat=lat,
        lon=lon,
        include_houses=True,
        tropical=True,
    )
    
    ascendant_tropical = result_tropical['houses']['ascendant']
    sign_index_tropical = int(ascendant_tropical / 30)
    degree_in_sign_tropical = ascendant_tropical % 30
    sign_name_tropical = signs[sign_index_tropical % 12]
    
    print(f"Tropical Ascendant: {sign_name_tropical} {degree_in_sign_tropical:.2f}° ({ascendant_tropical:.2f}°)")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
