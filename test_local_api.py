#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import json
import requests
import time
import subprocess
from threading import Thread

# Start the API service in the background
def start_api():
    subprocess.run([
        "python3", "-c", 
        "from swiss_calc_engine.service import run; run(host='127.0.0.1', port=8001)"
    ])

# Start API in background thread
api_thread = Thread(target=start_api, daemon=True)
api_thread.start()

# Wait for the service to start
time.sleep(3)

# Test the API
base_url = "http://127.0.0.1:8001"

# Test the houses endpoint with our test data
params = {
    'datetime': '2000-09-30T12:00:00',
    'lat': 22.5726459,
    'lon': 88.3638953,
    'tropical': False,  # Sidereal
    'assume_local_time': True
}

print("Testing local API...")
print(f"URL: {base_url}/v1/houses")
print(f"Parameters: {params}")
print()

try:
    response = requests.get(f"{base_url}/v1/houses", params=params, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ API Response successful!")
        print(json.dumps(data, indent=2))
        
        # Check the ascendant
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
            
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
