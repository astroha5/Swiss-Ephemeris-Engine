#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from swiss_calc_engine.engine import compute_positions, julian_day
import swisseph as swe

# Test with the provided details
dt = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5354
lon = 88.3633

print("Verifying ascendant calculation...")
print(f"Date: {dt}")
print(f"Location: {lat}°N, {lon}°E")
print()

# Calculate Julian day
jd = julian_day(dt)
print(f"Julian Day: {jd}")

# Test 1: Direct Swiss Ephemeris call for tropical houses
print("\n=== Tropical Houses (Direct Swiss Ephemeris) ===")
cusps_tropical, ascmc_tropical = swe.houses(jd, lat, lon, b'P')
ascendant_tropical = ascmc_tropical[0]
print(f"Ascendant (tropical): {ascendant_tropical}°")

signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
sign_index_tropical = int(ascendant_tropical / 30)
degree_in_sign_tropical = ascendant_tropical % 30
sign_name_tropical = signs[sign_index_tropical % 12]
print(f"Tropical Ascendant Sign: {sign_name_tropical}")
print(f"Degree: {degree_in_sign_tropical:.2f}°")

# Test 2: Direct Swiss Ephemeris call for sidereal houses
print("\n=== Sidereal Houses (Direct Swiss Ephemeris) ===")
swe.set_sid_mode(swe.SIDM_LAHIRI)
cusps_sidereal, ascmc_sidereal = swe.houses(jd, lat, lon, b'P')
ascendant_sidereal = ascmc_sidereal[0]
print(f"Ascendant (sidereal): {ascendant_sidereal}°")

sign_index_sidereal = int(ascendant_sidereal / 30)
degree_in_sign_sidereal = ascendant_sidereal % 30
sign_name_sidereal = signs[sign_index_sidereal % 12]
print(f"Sidereal Ascendant Sign: {sign_name_sidereal}")
print(f"Degree: {degree_in_sign_sidereal:.2f}°")

# Test 3: Using our engine
print("\n=== Using Our Engine ===")
try:
    result = compute_positions(
        dt=dt,
        lat=lat,
        lon=lon,
        include_houses=True,
        tropical=False,  # Use sidereal (Vedic)
    )
    
    ascendant_our = result['houses']['ascendant']
    print(f"Ascendant (our engine, sidereal): {ascendant_our}°")
    
    sign_index_our = int(ascendant_our / 30)
    degree_in_sign_our = ascendant_our % 30
    sign_name_our = signs[sign_index_our % 12]
    print(f"Our Engine Ascendant Sign: {sign_name_our}")
    print(f"Degree: {degree_in_sign_our:.2f}°")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
