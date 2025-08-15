#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
import swisseph as swe
from swiss_calc_engine.engine import julian_day, set_ephemeris_path

def fixed_get_house_cusps(jd: float, lat: float, lon: float, hsys: str = "P", sidereal: bool = True, ayanamsa: int = swe.SIDM_LAHIRI):
    """Compute house cusps and angles with correct sidereal adjustment."""
    # Swiss Ephemeris uses geographic longitude East positive; we assume lon East positive input
    cusps, ascmc = swe.houses(jd, lat, lon, hsys.encode('utf-8'))
    
    # Houses function doesn't apply sidereal correction automatically
    # We need to manually adjust if sidereal mode is requested
    if sidereal:
        # Set sidereal mode to calculate ayanamsa
        swe.set_sid_mode(ayanamsa)
        # Get ayanamsa value for the given Julian day
        ayanamsa_value = swe.get_ayanamsa_ut(jd)
        print(f"Ayanamsa value: {ayanamsa_value}°")
        
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
    
    return data

# Test with the provided details
dt = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5354
lon = 88.3633

print("Testing fixed ascendant calculation...")
print(f"Date: {dt}")
print(f"Location: {lat}°N, {lon}°E")
print()

# Calculate Julian day
jd = julian_day(dt)
print(f"Julian Day: {jd}")

# Test the tropical ascendant (should match original)
print("\n=== Tropical Ascendant ===")
tropical_houses = fixed_get_house_cusps(jd, lat, lon, sidereal=False)
ascendant_tropical = tropical_houses["ascendant"]
print(f"Ascendant (tropical): {ascendant_tropical}°")

# Test the sidereal ascendant (should be different from tropical)
print("\n=== Sidereal Ascendant (Fixed) ===")
sidereal_houses = fixed_get_house_cusps(jd, lat, lon, sidereal=True)
ascendant_sidereal = sidereal_houses["ascendant"]
print(f"Ascendant (sidereal): {ascendant_sidereal}°")

# Convert to zodiac signs
signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

sign_index_tropical = int(ascendant_tropical / 30)
degree_in_sign_tropical = ascendant_tropical % 30
sign_name_tropical = signs[sign_index_tropical % 12]

sign_index_sidereal = int(ascendant_sidereal / 30)
degree_in_sign_sidereal = ascendant_sidereal % 30
sign_name_sidereal = signs[sign_index_sidereal % 12]

print(f"\nTropical Ascendant Sign: {sign_name_tropical}")
print(f"Degree: {degree_in_sign_tropical:.2f}°")

print(f"\nSidereal Ascendant Sign: {sign_name_sidereal}")
print(f"Degree: {degree_in_sign_sidereal:.2f}°")
