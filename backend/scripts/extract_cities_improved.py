#!/usr/bin/env python3

"""
Improved script to extract city names from Wikipedia's Lists of cities by country
Focuses on table data for better accuracy
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
import time
from urllib.parse import urljoin
import os

def extract_city_lists():
    """
    Extract city lists from Wikipedia's Lists of cities by country page
    """
    print("🏙️ Extracting city names from Wikipedia (Improved Version)...")
    
    base_url = "https://en.wikipedia.org/wiki/Lists_of_cities_by_country"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find all links to "List of cities in..." pages
        city_list_links = []
        
        for link in soup.find_all("a", href=True):
            link_text = link.get_text(strip=True)
            if link_text.startswith("List of cities in"):
                href = link['href']
                if href.startswith('/wiki/'):
                    full_url = urljoin("https://en.wikipedia.org", href)
                    
                    country_match = re.match(r'List of cities in (.+?)(?:\s*-\s*.*)?$', link_text)
                    if country_match:
                        country_name = country_match.group(1).strip()
                        
                        # Focus on main countries without complex territorial designations
                        if not re.search(r'\(.*\)$', country_name) or country_name in [
                            "the United States", "the United Kingdom", "the Netherlands"
                        ]:
                            city_list_links.append({
                                'country': country_name,
                                'url': full_url,
                                'link_text': link_text
                            })
        
        print(f"📊 Found {len(city_list_links)} country city list pages")
        
        # Process a few key countries for demonstration
        target_countries = ['United States', 'Canada', 'France', 'Germany', 'Japan', 'Brazil', 'India', 'China']
        selected_links = []
        
        for country_info in city_list_links:
            for target in target_countries:
                if target.lower() in country_info['country'].lower():
                    selected_links.append(country_info)
                    break
        
        if not selected_links:
            # If no target countries found, use first 10
            selected_links = city_list_links[:10]
        
        print(f"🎯 Processing {len(selected_links)} selected countries...")
        
        all_cities = []
        processed_countries = 0
        
        for country_info in selected_links:
            print(f"🌍 Processing {country_info['country']}...")
            
            cities = extract_cities_from_country_page(country_info, headers)
            if cities:
                all_cities.extend(cities)
                processed_countries += 1
                
            time.sleep(1)  # Be respectful to Wikipedia
        
        print(f"✅ Extracted cities from {processed_countries} countries")
        print(f"🏙️ Total cities found: {len(all_cities)}")
        
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
    Focus on structured table data
    """
    cities = []
    
    try:
        response = requests.get(country_info['url'], headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Primary focus: Extract from tables (most reliable)
        table_cities = extract_from_tables(soup, country_info['country'])
        cities.extend(table_cities)
        
        # Secondary: Extract from well-structured lists with city links
        if len(table_cities) < 20:  # Only if we didn't get much from tables
            list_cities = extract_from_structured_lists(soup, country_info['country'])
            cities.extend(list_cities)
        
        # Remove duplicates
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
    Extract cities from table structures - most reliable method
    """
    cities = []
    
    # Look for tables that contain city data
    tables = soup.find_all("table", {"class": ["wikitable", "sortable"]})
    
    for table in tables:
        # Check if this table likely contains city data
        header_row = table.find("tr")
        if header_row:
            headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]
            
            # Look for typical city table headers
            city_indicators = ['city', 'name', 'municipality', 'town', 'settlement', 'place']
            has_city_header = any(indicator in ' '.join(headers) for indicator in city_indicators)
            
            if has_city_header or len(headers) >= 2:  # Either has city headers or is a multi-column table
                rows = table.find_all("tr")[1:]  # Skip header
                
                for row in rows:
                    cells = row.find_all(["td", "th"])
                    if cells:
                        # First cell usually contains the city name in city tables
                        first_cell = cells[0]
                        
                        # Prefer linked city names
                        city_link = first_cell.find("a")
                        if city_link:
                            city_text = city_link.get_text(strip=True)
                            href = city_link.get('href', '')
                            
                            # Skip if it's clearly not a city
                            if any(skip in href.lower() for skip in [
                                'list_of', 'category:', 'file:', 'template:', 'province', 'state'
                            ]):
                                continue
                        else:
                            city_text = first_cell.get_text(strip=True)
                        
                        city_name = clean_city_name(city_text)
                        if city_name and is_valid_city_name(city_name):
                            # Additional validation for table data
                            if len(city_name) > 1 and not city_name.isdigit():
                                cities.append({
                                    'name': city_name,
                                    'country': country_name,
                                    'source': 'table'
                                })
    
    return cities

def extract_from_structured_lists(soup, country_name):
    """
    Extract cities from well-structured lists with city links
    """
    cities = []
    
    # Look for content area
    content_area = soup.find("div", {"class": "mw-parser-output"}) or soup
    
    # Find lists that are likely to contain cities
    for ul in content_area.find_all("ul"):
        # Skip navigation and reference lists
        if ul.get('class') and any(cls in ['navbox', 'reference', 'reflist'] for cls in ul.get('class')):
            continue
            
        city_count = 0
        list_items = ul.find_all("li")
        
        # Quick check: does this list contain mostly city-like links?
        for item in list_items[:10]:  # Check first 10 items
            link = item.find("a")
            if link:
                href = link.get('href', '')
                text = link.get_text(strip=True)
                
                if (href.startswith('/wiki/') and 
                    not any(skip in href.lower() for skip in ['list_of', 'category:', 'file:', 'template:']) and
                    is_valid_city_name(text)):
                    city_count += 1
        
        # If this list seems to contain cities, process all items
        if city_count >= 3:  # At least 3 city-like items in first 10
            for item in list_items:
                link = item.find("a")
                if link:
                    city_text = link.get_text(strip=True)
                    href = link.get('href', '')
                    
                    if (href.startswith('/wiki/') and 
                        not any(skip in href.lower() for skip in ['list_of', 'category:', 'file:', 'template:'])):
                        
                        city_name = clean_city_name(city_text)
                        if city_name and is_valid_city_name(city_name):
                            cities.append({
                                'name': city_name,
                                'country': country_name,
                                'source': 'list',
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
    city_name = re.sub(r'\(.*?\)', '', city_name)  # Remove parentheses
    city_name = city_name.strip()
    
    # Remove table section indicators
    city_name = re.sub(r'^[\d\.]+\s*', '', city_name)  # Remove leading numbers
    
    return city_name if city_name else None

def is_valid_city_name(city_name):
    """
    Check if the extracted text is likely a valid city name
    """
    if not city_name or len(city_name) < 2:
        return False
    
    # Enhanced filtering for common non-city terms
    invalid_terms = [
        'main page', 'contents', 'current events', 'random article', 'contact us',
        'recent changes', 'special pages', 'donate', 'create account', 'log in',
        'contributions', 'talk', 'edit', 'history', 'what links here',
        'list of', 'category', 'template', 'file', 'image', 'commons',
        'wikipedia', 'portal', 'help', 'user', 'navigation', 'menu',
        'province', 'state', 'region', 'county', 'district', 'municipality',
        'see also', 'references', 'external links', 'further reading',
        'main article', 'disambiguation', 'redirect', 'geography', 'climate',
        'population', 'economy', 'government', 'transport', 'culture',
        'over', 'inhabitants', 'under', 'between', 'total'
    ]
    
    city_lower = city_name.lower()
    
    # Skip if it contains common non-city terms
    if any(term in city_lower for term in invalid_terms):
        return False
    
    # Skip if it's mostly numbers
    if re.match(r'^[\d\.\,\s\-]+$', city_name):
        return False
    
    # Skip section headers (numbers followed by text)
    if re.match(r'^\d+[\.\d]*\s*[a-zA-Z]', city_name):
        return False
    
    # Must contain letters
    if not re.search(r'[a-zA-Z]', city_name):
        return False
    
    # Skip very short or very long names
    if len(city_name) < 2 or len(city_name) > 50:
        return False
    
    return True

def save_city_data(cities_data):
    """
    Save city data in multiple formats
    """
    if not cities_data:
        print("❌ No city data to save")
        return
    
    os.makedirs("data", exist_ok=True)
    
    # Save as CSV with proper UTF-8 encoding
    csv_file = "data/cities_improved.csv"
    print(f"💾 Saving to {csv_file}")
    df = pd.DataFrame(cities_data)
    df.to_csv(csv_file, index=False, encoding='utf-8-sig')
    
    # Save as JSON
    json_file = "data/cities_improved.json"
    print(f"💾 Saving to {json_file}")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(cities_data, f, indent=2, ensure_ascii=False)
    
    # Create lookup by country
    cities_by_country = {}
    for city in cities_data:
        country = city['country']
        if country not in cities_by_country:
            cities_by_country[country] = []
        cities_by_country[country].append(city['name'])
    
    for country in cities_by_country:
        cities_by_country[country] = sorted(list(set(cities_by_country[country])))
    
    country_file = "data/cities_by_country_improved.json"
    print(f"💾 Saving to {country_file}")
    with open(country_file, 'w', encoding='utf-8') as f:
        json.dump(cities_by_country, f, indent=2, ensure_ascii=False)
    
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
            for i, city in enumerate(data[:20]):
                if isinstance(city, dict):
                    print(f"  {i+1}. {city.get('name', 'N/A')} ({city.get('country', 'N/A')})")
                    
            if len(data) > 20:
                print(f"  ... and {len(data) - 20} more cities")
                
        elif isinstance(data, dict):
            sample_keys = list(data.keys())[:10]
            for key in sample_keys:
                if isinstance(data[key], list):
                    city_count = len(data[key])
                    sample_cities = ', '.join(data[key][:5])
                    if city_count > 5:
                        sample_cities += f", ... ({city_count} total)"
                    print(f"  {key}: {sample_cities}")
                    
    except Exception as e:
        print(f"❌ Error reading sample data: {e}")

if __name__ == "__main__":
    print("🚀 Starting improved city name extraction...")
    cities = extract_city_lists()
    
    if cities:
        print_sample_data("data/cities_improved.json")
        print_sample_data("data/cities_by_country_improved.json")
        
        print("\n✅ Improved city name extraction complete!")
        print("📁 Files created:")
        print("  - data/cities_improved.csv")
        print("  - data/cities_improved.json")
        print("  - data/cities_by_country_improved.json")
    else:
        print("❌ No cities were extracted")
