#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
import swisseph as swe
from swiss_calc_engine.engine import julian_day

# Test with the provided details
dt = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5726459
lon = 88.3638953

print("Debug: Detailed ascendant calculation...")
print(f"Date: {dt}")
print(f"Location: {lat}°N, {lon}°E")
print()

# Calculate Julian day
jd = julian_day(dt)
print(f"Julian Day: {jd}")

# Get ayanamsa for this date
swe.set_sid_mode(swe.SIDM_LAHIRI)
ayanamsa = swe.get_ayanamsa_ut(jd)
print(f"Lahiri Ayanamsa: {ayanamsa}°")

# Calculate tropical houses
print("\n=== Tropical Houses ===")
cusps_tropical, ascmc_tropical = swe.houses(jd, lat, lon, b'P')
tropical_asc = ascmc_tropical[0]
print(f"Tropical Ascendant: {tropical_asc}°")

# Manual sidereal correction
sidereal_asc = tropical_asc - ayanamsa
if sidereal_asc < 0:
    sidereal_asc += 360
print(f"Sidereal Ascendant (manual): {sidereal_asc}°")

# Convert to signs
signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

# Tropical sign
trop_sign_idx = int(tropical_asc / 30)
trop_degree = tropical_asc % 30
trop_sign = signs[trop_sign_idx]

# Sidereal sign
sid_sign_idx = int(sidereal_asc / 30)
sid_degree = sidereal_asc % 30
sid_sign = signs[sid_sign_idx]

print(f"Tropical: {trop_sign} {trop_degree:.2f}°")
print(f"Sidereal: {sid_sign} {sid_degree:.2f}°")

# Let's also check what the expected Sagittarius range would be
print("\n=== Expected Values for Sagittarius ===")
print("Sagittarius range: 240° - 270°")
print("For the ascendant to be in Sagittarius, it should be between 240° and 270°")

# Check if there's an issue with time zone or coordinate interpretation
print("\n=== Time Zone Check ===")
print("Input datetime is naive (no timezone)")
print("Engine assumes UTC if no timezone is specified")
print("Let's check if this should be local time instead...")

# Try with different time interpretations
import pytz

# Kolkata time zone (since coordinates are in India)
kolkata_tz = pytz.timezone('Asia/Kolkata')

# If the input time was meant to be local time in Kolkata
dt_local = kolkata_tz.localize(datetime(2000, 9, 30, 12, 0, 0))
dt_utc = dt_local.astimezone(pytz.UTC)
print(f"If input was Kolkata local time: {dt_local}")
print(f"Equivalent UTC time: {dt_utc}")

# Recalculate with UTC interpretation
jd_utc = julian_day(dt_utc)
print(f"Julian Day (UTC corrected): {jd_utc}")

cusps_utc, ascmc_utc = swe.houses(jd_utc, lat, lon, b'P')
tropical_asc_utc = ascmc_utc[0]
sidereal_asc_utc = tropical_asc_utc - ayanamsa
if sidereal_asc_utc < 0:
    sidereal_asc_utc += 360

sid_sign_idx_utc = int(sidereal_asc_utc / 30)
sid_degree_utc = sidereal_asc_utc % 30
sid_sign_utc = signs[sid_sign_idx_utc]

print(f"Sidereal with UTC correction: {sid_sign_utc} {sid_degree_utc:.2f}° ({sidereal_asc_utc:.2f}°)")

# Let's also try a few hours around noon to see the range
print("\n=== Time Sensitivity Check ===")
for hour in range(10, 15):
    dt_test = datetime(2000, 9, 30, hour, 0, 0)
    jd_test = julian_day(dt_test)
    cusps_test, ascmc_test = swe.houses(jd_test, lat, lon, b'P')
    tropical_test = ascmc_test[0]
    sidereal_test = tropical_test - ayanamsa
    if sidereal_test < 0:
        sidereal_test += 360
    
    test_sign_idx = int(sidereal_test / 30)
    test_sign = signs[test_sign_idx]
    test_degree = sidereal_test % 30
    
    print(f"At {hour:02d}:00 UTC - Sidereal Asc: {test_sign} {test_degree:.1f}° ({sidereal_test:.1f}°)")
