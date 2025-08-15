#!/usr/bin/env python3

import json
import urllib.request
import urllib.parse

# Test the deployed API
base_url = "https://swiss-ephemeris-engine.onrender.com"

# Test the houses endpoint with our test data
params = {
    'datetime': '2000-09-30T12:00:00',
    'lat': 22.5726459,
    'lon': 88.3638953,
    'tropical': 'false',  # Sidereal (as string for URL)
    'hsys': 'P'
}

query_string = urllib.parse.urlencode(params)
url = f"{base_url}/v1/houses?{query_string}"

print("Testing deployed API...")
print(f"URL: {url}")
print()

try:
    with urllib.request.urlopen(url, timeout=30) as response:
        if response.status == 200:
            data = json.loads(response.read().decode())
            print("✅ API Response successful!")
            print(json.dumps(data, indent=2))
            
            # Check the ascendant
            if 'houses' in data and 'ascendant' in data['houses']:
                ascendant = data['houses']['ascendant']
                signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
                sign_index = int(ascendant / 30)
                sign_name = signs[sign_index % 12]
                degree_in_sign = ascendant % 30
                
                print(f"\n🎯 Ascendant Result:")
                print(f"Longitude: {ascendant:.2f}°")
                print(f"Sign: {sign_name}")
                print(f"Degree: {degree_in_sign:.2f}°")
                
                if sign_name == "Sagittarius":
                    print("✅ CORRECT! Got Sagittarius as expected!")
                else:
                    print("❌ Expected Sagittarius, got", sign_name)
                    print("⚠️  This means the deployed version still has the old timezone issue")
            else:
                print("❌ No ascendant data in response")
                
        else:
            print(f"❌ API Error: {response.status}")
            print(f"Response: {response.read().decode()}")
            
except Exception as e:
    print(f"❌ Error: {e}")
