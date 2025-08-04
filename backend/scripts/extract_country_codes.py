#!/usr/bin/env python3

"""
Script to extract ISO 3166 country codes from Wikipedia
Creates a comprehensive list of countries with their codes and names
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import csv
import re

def extract_country_codes():
    """
    Extract country codes from Wikipedia's ISO 3166 page
    """
    print("🌍 Extracting country codes from Wikipedia...")
    
    url = "https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes"
    
    try:
        # Request the page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find the main table with country codes
        # Look for the table with the sortable class
        tables = soup.find_all("table", {"class": "wikitable"})
        
        country_data = []
        
        # Find the correct table (should be the largest one with country data)
        main_table = None
        for table in tables:
            rows = table.find_all("tr")
            if len(rows) > 200:  # The main country table has ~250 rows
                main_table = table
                break
        
        if not main_table:
            print("❌ Could not find the main country codes table")
            return
        
        print(f"📊 Found table with {len(main_table.find_all('tr'))} rows")
        
        # Extract data from each row
        rows = main_table.find_all("tr")[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) >= 6:  # Ensure we have enough columns
                try:
                    # Extract the key information
                    iso_name = cells[0].get_text(strip=True)
                    official_name = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    sovereignty = cells[2].get_text(strip=True) if len(cells) > 2 else ""
                    alpha_2 = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                    alpha_3 = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                    numeric = cells[5].get_text(strip=True) if len(cells) > 5 else ""
                    
                    # Clean up the data
                    iso_name = re.sub(r'\[.*?\]', '', iso_name).strip()  # Remove footnotes
                    official_name = re.sub(r'\[.*?\]', '', official_name).strip()
                    
                    # Skip empty or invalid entries
                    if not iso_name or not alpha_2 or len(alpha_2) != 2:
                        continue
                    
                    country_info = {
                        'iso_name': iso_name,
                        'official_name': official_name,
                        'sovereignty': sovereignty,
                        'alpha_2': alpha_2,
                        'alpha_3': alpha_3,
                        'numeric': numeric
                    }
                    
                    country_data.append(country_info)
                    
                except Exception as e:
                    print(f"⚠️ Error processing row: {e}")
                    continue
        
        print(f"✅ Extracted {len(country_data)} countries")
        
        # Save to multiple formats
        save_country_data(country_data)
        
    except requests.RequestException as e:
        print(f"❌ Error fetching Wikipedia page: {e}")
    except Exception as e:
        print(f"❌ Error processing data: {e}")

def save_country_data(country_data):
    """
    Save country data in multiple formats
    """
    # Save as CSV
    csv_file = "data/country_codes.csv"
    print(f"💾 Saving to {csv_file}")
    
    # Create data directory if it doesn't exist
    import os
    os.makedirs("data", exist_ok=True)
    
    df = pd.DataFrame(country_data)
    df.to_csv(csv_file, index=False)
    
    # Save as JSON
    json_file = "data/country_codes.json"
    print(f"💾 Saving to {json_file}")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(country_data, f, indent=2, ensure_ascii=False)
    
    # Create a simplified lookup file for location matching
    lookup_data = create_country_lookup(country_data)
    
    # Save lookup as JSON
    lookup_file = "data/country_lookup.json"
    print(f"💾 Saving lookup to {lookup_file}")
    with open(lookup_file, 'w', encoding='utf-8') as f:
        json.dump(lookup_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(country_data)} countries in multiple formats")

def create_country_lookup(country_data):
    """
    Create a lookup dictionary for country matching
    Maps various country name variations to their ISO codes
    """
    lookup = {}
    
    for country in country_data:
        iso_name = country['iso_name'].lower().strip()
        official_name = country['official_name'].lower().strip()
        alpha_2 = country['alpha_2']
        alpha_3 = country['alpha_3']
        
        # Add ISO name
        if iso_name:
            lookup[iso_name] = {
                'alpha_2': alpha_2,
                'alpha_3': alpha_3,
                'name': country['iso_name']
            }
        
        # Add official name if different
        if official_name and official_name != iso_name:
            # Remove common prefixes
            clean_official = re.sub(r'^(the\s+|republic\s+of\s+|kingdom\s+of\s+|state\s+of\s+)', '', official_name)
            if clean_official and clean_official != iso_name:
                lookup[clean_official] = {
                    'alpha_2': alpha_2,
                    'alpha_3': alpha_3,
                    'name': country['iso_name']
                }
        
        # Add alpha codes as keys
        if alpha_2:
            lookup[alpha_2.lower()] = {
                'alpha_2': alpha_2,
                'alpha_3': alpha_3,
                'name': country['iso_name']
            }
        
        if alpha_3:
            lookup[alpha_3.lower()] = {
                'alpha_2': alpha_2,
                'alpha_3': alpha_3,
                'name': country['iso_name']
            }
        
        # Add common variations
        variations = get_country_variations(iso_name)
        for variation in variations:
            if variation and variation not in lookup:
                lookup[variation] = {
                    'alpha_2': alpha_2,
                    'alpha_3': alpha_3,
                    'name': country['iso_name']
                }
    
    return lookup

def get_country_variations(country_name):
    """
    Generate common variations of country names
    """
    variations = []
    name = country_name.lower().strip()
    
    # Remove common prefixes/suffixes
    variations.append(re.sub(r'^the\s+', '', name))
    variations.append(re.sub(r'\s+\(.*?\)$', '', name))  # Remove parentheses
    
    # Common country name mappings
    mappings = {
        'united states': ['usa', 'america', 'us'],
        'united kingdom': ['uk', 'britain', 'great britain', 'england'],
        'russia': ['russian federation'],
        'china': ['people\'s republic of china', 'prc'],
        'south korea': ['korea', 'republic of korea'],
        'north korea': ['democratic people\'s republic of korea', 'dprk'],
        'iran': ['islamic republic of iran'],
        'syria': ['syrian arab republic'],
        'venezuela': ['bolivarian republic of venezuela'],
        'bolivia': ['plurinational state of bolivia'],
        'democratic republic of the congo': ['congo', 'drc'],
        'czech republic': ['czechia'],
        'myanmar': ['burma'],
        'eswatini': ['swaziland']
    }
    
    for standard, alts in mappings.items():
        if standard in name:
            variations.extend(alts)
        elif name in alts:
            variations.append(standard)
            variations.extend([alt for alt in alts if alt != name])
    
    return [v for v in variations if v]

def print_sample_data(filename):
    """
    Print sample of extracted data
    """
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n📋 Sample of extracted data from {filename}:")
        for i, country in enumerate(data[:10]):
            if isinstance(country, dict):
                print(f"  {i+1}. {country.get('iso_name', 'N/A')} ({country.get('alpha_2', 'N/A')})")
            else:
                print(f"  {i+1}. {country}")
        
        if len(data) > 10:
            print(f"  ... and {len(data) - 10} more countries")
            
    except Exception as e:
        print(f"❌ Error reading sample data: {e}")

if __name__ == "__main__":
    print("🚀 Starting country code extraction...")
    extract_country_codes()
    
    # Print sample of the data
    print_sample_data("data/country_codes.json")
    print_sample_data("data/country_lookup.json")
    
    print("\n✅ Country code extraction complete!")
    print("📁 Files created:")
    print("  - data/country_codes.csv (raw data)")
    print("  - data/country_codes.json (structured data)")
    print("  - data/country_lookup.json (lookup dictionary)")
