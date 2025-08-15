#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from swiss_calc_engine.engine import compute_positions

# Test with the provided details
# Engine now automatically interprets naive datetime as local time based on coordinates
dt = datetime(2000, 9, 30, 12, 0, 0)  # Naive datetime - interpreted as local time
lat = 22.5726459
lon = 88.3638953

print("Testing ascendant calculation...")
print(f"Date: {dt} (interpreted as local time)")
print(f"Location: {lat}°N, {lon}°E (Kolkata, India)")
print()

try:
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
    
    # Also try tropical for comparison
    result_tropical = compute_positions(
        dt=dt,
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
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
