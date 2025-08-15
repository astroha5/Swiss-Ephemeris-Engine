#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
import swisseph as swe

# Test with the provided details
dt = datetime(2000, 9, 30, 12, 0, 0)
lat = 22.5354
lon = 88.3633

print("Testing sidereal houses calculation...")
print(f"Date: {dt}")
print(f"Location: {lat}°N, {lon}°E")
print()

# Calculate Julian day manually
import math
year = dt.year
month = dt.month
day = dt.day
hour = dt.hour + dt.minute/60.0 + dt.second/3600.0

# Julian day calculation
if month <= 2:
    year -= 1
    month += 12

a = year // 100
b = 2 - a + a // 4
jd = math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + hour/24.0

print(f"Julian Day: {jd}")

# Test 1: Tropical houses
print("\n=== Tropical Houses ===")
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

# Test 2: Sidereal houses with proper setup
print("\n=== Sidereal Houses (Proper Setup) ===")
# Set sidereal mode
swe.set_sid_mode(swe.SIDM_LAHIRI)
print(f"Set sidereal mode to LAHIRI: {swe.get_sid_mode()}")

# For houses, we need to manually adjust the ascendant
# The houses function doesn't automatically apply sidereal correction
# We need to calculate the ayanamsa and apply it manually

# Get ayanamsa
ayanamsa = swe.get_ayanamsa(jd)
print(f"Ayanamsa: {ayanamsa}°")

# Calculate tropical ascendant first
cusps_tropical, ascmc_tropical = swe.houses(jd, lat, lon, b'P')
tropical_ascendant = ascmc_tropical[0]

# Apply ayanamsa correction for sidereal
sidereal_ascendant = tropical_ascendant - ayanamsa
# Normalize to 0-360 range
sidereal_ascendant = sidereal_ascendant % 360
if sidereal_ascendant < 0:
    sidereal_ascendant += 360

print(f"Tropical Ascendant: {tropical_ascendant}°")
print(f"Sidereal Ascendant (manual correction): {sidereal_ascendant}°")

sign_index_sidereal = int(sidereal_ascendant / 30)
degree_in_sign_sidereal = sidereal_ascendant % 30
sign_name_sidereal = signs[sign_index_sidereal % 12]
print(f"Sidereal Ascendant Sign: {sign_name_sidereal}")
print(f"Degree: {degree_in_sign_sidereal:.2f}°")

# Test 3: Check if there's a different house system that applies sidereal automatically
print("\n=== Testing Different House Systems ===")
# Try setting sidereal flag explicitly (if available)
try:
    # This might not work as expected, but let's try
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    cusps_sidereal, ascmc_sidereal = swe.houses(jd, lat, lon, b'P')
    ascendant_sidereal = ascmc_sidereal[0]
    print(f"Ascendant with sidereal mode set: {ascendant_sidereal}°")
except Exception as e:
    print(f"Error: {e}")
