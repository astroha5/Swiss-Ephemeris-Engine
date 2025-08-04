#!/usr/bin/env python3

"""
Script to extract city names from Wikipedia's Lists of cities by country
Creates a comprehensive list of cities organized by country
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import csv
import re
import time
from urllib.parse import urljoin, urlparse
import os

def extract_city_lists():
    """
    Extract city lists from Wikipedia's Lists of cities by country page
    """
    print("🏙️ Extracting city names from Wikipedia...")
    
    base_url = "https://en.wikipedia.org/wiki/Lists_of_cities_by_country"
    
    try:
        # Request the main page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find all links to "List of cities in..." pages
        city_list_links = []
        
        # Look for links that contain "List of cities in"
        for link in soup.find_all("a", href=True):
            link_text = link.get_text(strip=True)
            if link_text.startswith("List of cities in"):
                href = link['href']
                if href.startswith('/wiki/'):
                    full_url = urljoin("https://en.wikipedia.org", href)
                    
                    # Extract country name from the link text
                    country_match = re.match(r'List of cities in (.+?)(?:\s*-\s*.*)?$', link_text)
                    if country_match:
                        country_name = country_match.group(1).strip()
                        
                        # Skip territories and dependencies that have additional info in parentheses for now
                        # Focus on main countries
                        if not re.search(r'\(.*\)$', country_name) or country_name in [
                            "the United States", "the United Kingdom", "the Netherlands"
                        ]:
                            city_list_links.append({
                                'country': country_name,
                                'url': full_url,
                                'link_text': link_text
                            })
        
        print(f"📊 Found {len(city_list_links)} country city list pages")
        
        # Extract cities from each country's page
        all_cities = []
        processed_countries = 0
        max_countries = 20  # Limit for initial run to avoid overwhelming Wikipedia
        
        for country_info in city_list_links[:max_countries]:
            print(f"🌍 Processing {country_info['country']}...")
            
            cities = extract_cities_from_country_page(country_info, headers)
            if cities:
                all_cities.extend(cities)
                processed_countries += 1
                
            # Be respectful to Wikipedia's servers
            time.sleep(1)
        
        print(f"✅ Extracted cities from {processed_countries} countries")
        print(f"🏙️ Total cities found: {len(all_cities)}")
        
        # Save the data
        save_city_data(all_cities)
        
        return all_cities
        
    except requests.RequestException as e:
        print(f"❌ Error fetching Wikipedia page: {e}")
        return []
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        return []

def extract_cities_from_country_page(country_info, headers):
    """
    Extract city names from a specific country's city list page
    """
    cities = []
    
    try:
        response = requests.get(country_info['url'], headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Different pages have different structures, so we'll try multiple approaches
        cities.extend(extract_from_tables(soup, country_info['country']))
        cities.extend(extract_from_lists(soup, country_info['country']))
        cities.extend(extract_from_links(soup, country_info['country']))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_cities = []
        for city in cities:
            city_key = (city['name'].lower(), city['country'])
            if city_key not in seen:
                seen.add(city_key)
                unique_cities.append(city)
        
        print(f"  📍 Found {len(unique_cities)} cities in {country_info['country']}")
        return unique_cities
        
    except Exception as e:
        print(f"  ⚠️ Error processing {country_info['country']}: {e}")
        return []

def extract_from_tables(soup, country_name):
    """
    Extract cities from table structures
    """
    cities = []
    
    # Look for tables that might contain city data
    tables = soup.find_all("table", {"class": ["wikitable", "sortable"]})
    
    for table in tables:
        rows = table.find_all("tr")
        if len(rows) > 1:  # Has header and data rows
            for row in rows[1:]:  # Skip header
                cells = row.find_all(["td", "th"])
                if cells:
                    # First cell usually contains the city name
                    city_text = cells[0].get_text(strip=True)
                    city_name = clean_city_name(city_text)
                    if city_name and is_valid_city_name(city_name):
                        cities.append({
                            'name': city_name,
                            'country': country_name,
                            'source': 'table'
                        })
    
    return cities

def extract_from_lists(soup, country_name):
    """
    Extract cities from list structures (ul, ol)
    """
    cities = []
    
    # Only process lists within the main content area of the page
    content_area = soup.find("div", {"class": "mw-parser-output"}) or soup
    lists = content_area.find_all(["ul", "ol"])
    
    for list_elem in lists:
        # Skip navigation, reference, and other non-content lists
        if list_elem.get('class') and any(cls in ['navbox', 'reference', 'reflist', 'sidebar', 'infobox'] 
                                         for cls in list_elem.get('class')):
            continue
            
        # Check parent elements to see if the list is within sidebar, navigation, or footer areas
        parent = list_elem.parent
        skip_list = False
        while parent:
            if parent.get('class'):
                parent_classes = parent.get('class')
                if any(cls in ['sidebar', 'navbox', 'infobox', 'mw-navigation', 'footer'] for cls in parent_classes):
                    skip_list = True
                    break
            if parent.get('id') and any(nav_id in parent.get('id') for nav_id in ['navigation', 'sidebar', 'footer']):
                skip_list = True
                break
            parent = parent.parent
            
        if skip_list:
            continue
            
        list_items = list_elem.find_all("li")
        for item in list_items:
            # Extract text, preferring links to city articles
            city_link = item.find("a")
            if city_link:
                city_text = city_link.get_text(strip=True)
                # Only process if the link appears to be to a city article
                href = city_link.get('href', '')
                if not href.startswith('/wiki/') or any(skip in href.lower() for skip in [
                    'list_of', 'category:', 'file:', 'template:', 'help:',
                    'wikipedia:', 'portal:', 'user:'
                ]):
                    continue
            else:
                city_text = item.get_text(strip=True)
            
            city_name = clean_city_name(city_text)
            if city_name and is_valid_city_name(city_name):
                cities.append({
                    'name': city_name,
                    'country': country_name,
                    'source': 'list'
                })
    
    return cities

def extract_from_links(soup, country_name):
    """
    Extract cities from links that appear to be city names
    """
    cities = []
    
    # Look for links in the main content area
    content_area = soup.find("div", {"class": "mw-parser-output"}) or soup
    
    for link in content_area.find_all("a", href=True):
        href = link.get('href', '')
        link_text = link.get_text(strip=True)
        
        # Skip if it's clearly not a city link
        if (href.startswith('/wiki/') and 
            not any(skip in href.lower() for skip in [
                'list_of', 'category:', 'file:', 'template:', 'help:', 
                'wikipedia:', 'portal:', 'user:'
            ]) and
            not any(skip in link_text.lower() for skip in [
                'province', 'state', 'region', 'county', 'district',
                'list of', 'category', 'template', 'wikipedia'
            ])):
            
            city_name = clean_city_name(link_text)
            if city_name and is_valid_city_name(city_name):
                cities.append({
                    'name': city_name,
                    'country': country_name,
                    'source': 'link',
                    'wikipedia_url': f"https://en.wikipedia.org{href}"
                })
    
    return cities

def clean_city_name(city_text):
    """
    Clean and normalize city names
    """
    if not city_text:
        return None
    
    # Remove footnotes and references
    city_name = re.sub(r'\[.*?\]', '', city_text)
    city_name = re.sub(r'\(.*?\)', '', city_name)  # Remove parentheses content
    city_name = city_name.strip()
    
    # Remove common prefixes/suffixes that aren't part of the city name
    city_name = re.sub(r'^(List of |Category:|File:|Template:)', '', city_name, flags=re.IGNORECASE)
    
    return city_name if city_name else None

def is_valid_city_name(city_name):
    """
    Check if the extracted text is likely a valid city name
    """
    if not city_name or len(city_name) < 2:
        return False
    
    # Skip common non-city terms
    invalid_terms = [
        'list of', 'category', 'template', 'file', 'image', 'commons',
        'wikipedia', 'portal', 'help', 'user', 'talk', 'edit', 'history',
        'province', 'state', 'region', 'county', 'district', 'municipality',
        'see also', 'references', 'external links', 'navigation', 'menu',
        'main article', 'disambiguation', 'redirect'
    ]
    
    city_lower = city_name.lower()
    if any(term in city_lower for term in invalid_terms):
        return False
    
    # Must contain at least one letter
    if not re.search(r'[a-zA-Z]', city_name):
        return False
    
    # Skip if it's mostly numbers or special characters
    if len(re.sub(r'[^a-zA-Z\s\-\']', '', city_name)) < len(city_name) * 0.5:
        return False
    
    return True

def save_city_data(cities_data):
    """
    Save city data in multiple formats
    """
    if not cities_data:
        print("❌ No city data to save")
        return
    
    # Create data directory if it doesn't exist
    os.makedirs("data", exist_ok=True)
    
    # Save as CSV with proper UTF-8 encoding
    csv_file = "data/cities.csv"
    print(f"💾 Saving to {csv_file}")
    
    df = pd.DataFrame(cities_data)
    df.to_csv(csv_file, index=False, encoding='utf-8-sig')
    
    # Save as JSON
    json_file = "data/cities.json"
    print(f"💾 Saving to {json_file}")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(cities_data, f, indent=2, ensure_ascii=False)
    
    # Create a lookup dictionary by country
    cities_by_country = {}
    for city in cities_data:
        country = city['country']
        if country not in cities_by_country:
            cities_by_country[country] = []
        cities_by_country[country].append(city['name'])
    
    # Sort cities within each country
    for country in cities_by_country:
        cities_by_country[country] = sorted(list(set(cities_by_country[country])))
    
    # Save country-organized data
    country_file = "data/cities_by_country.json"
    print(f"💾 Saving to {country_file}")
    with open(country_file, 'w', encoding='utf-8') as f:
        json.dump(cities_by_country, f, indent=2, ensure_ascii=False)
    
    # Create a simple city lookup (city name -> country list)
    city_lookup = {}
    for city in cities_data:
        city_name = city['name'].lower()
        country = city['country']
        if city_name not in city_lookup:
            city_lookup[city_name] = []
        if country not in city_lookup[city_name]:
            city_lookup[city_name].append(country)
    
    lookup_file = "data/city_lookup.json"
    print(f"💾 Saving to {lookup_file}")
    with open(lookup_file, 'w', encoding='utf-8') as f:
        json.dump(city_lookup, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(cities_data)} cities in multiple formats")
    print(f"🌍 Countries covered: {len(cities_by_country)}")

def print_sample_data(filename):
    """
    Print sample of extracted data
    """
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n📋 Sample of extracted data from {filename}:")
        
        if isinstance(data, list):
            # For cities.json (list format)
            for i, city in enumerate(data[:15]):
                if isinstance(city, dict):
                    print(f"  {i+1}. {city.get('name', 'N/A')} ({city.get('country', 'N/A')})")
                else:
                    print(f"  {i+1}. {city}")
            
            if len(data) > 15:
                print(f"  ... and {len(data) - 15} more cities")
                
        elif isinstance(data, dict):
            # For cities_by_country.json or city_lookup.json
            sample_keys = list(data.keys())[:10]
            for key in sample_keys:
                if isinstance(data[key], list):
                    city_count = len(data[key])
                    sample_cities = ', '.join(data[key][:3])
                    if city_count > 3:
                        sample_cities += f", ... ({city_count} total)"
                    print(f"  {key}: {sample_cities}")
            
            if len(data) > 10:
                print(f"  ... and {len(data) - 10} more entries")
                
    except Exception as e:
        print(f"❌ Error reading sample data: {e}")

if __name__ == "__main__":
    print("🚀 Starting city name extraction...")
    cities = extract_city_lists()
    
    if cities:
        # Print samples of the data
        print_sample_data("data/cities.json")
        print_sample_data("data/cities_by_country.json")
        
        print("\n✅ City name extraction complete!")
        print("📁 Files created:")
        print("  - data/cities.csv (raw data)")
        print("  - data/cities.json (structured data)")
        print("  - data/cities_by_country.json (organized by country)")
        print("  - data/city_lookup.json (city name lookup)")
    else:
        print("❌ No cities were extracted")
