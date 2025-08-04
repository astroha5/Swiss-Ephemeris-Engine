# CSV Seeding Guide for World Events

## Overview

Yes, I can absolutely help you read a CSV file and update your Supabase database with major world events! Your system already has a comprehensive CSV seeding infrastructure in place.

## How to Use

### 1. CSV File Structure

Create your CSV file with the following exact column headers:

```csv
title,description,event_date,category,event_type,impact_level,location_name,latitude,longitude,country_code,affected_population,source_url,source_name
```

### 2. File Placement

Place your CSV file in one of these locations:

**Default location:**
```
/Users/richardbelll/Astrova/backend/data/eventsToSeed.csv
```

**Custom location:**
Use the `--file` parameter to specify a different path.

### 3. Column Specifications

#### Required Fields:
- **title**: Event name/title (text)
- **description**: Detailed description of the event (text)
- **event_date**: ISO 8601 formatted date (e.g., "2001-09-11T08:46:00Z")
- **category**: Must be one of the valid categories (see below)
- **event_type**: Must be one of the valid event types (see below)
- **impact_level**: Must be one of: `low`, `medium`, `high`, `extreme`
- **location_name**: Name of the location where event occurred

#### Optional Fields:
- **latitude**: Latitude coordinate (-90 to 90)
- **longitude**: Longitude coordinate (-180 to 180)
- **country_code**: ISO country code (e.g., "US", "GB", "FR")
- **affected_population**: Number of people affected (integer)
- **source_url**: URL to source information
- **source_name**: Name of the source

### 4. Valid Categories

Your database schema accepts these categories:
- `financial` - Market crashes, economic events
- `natural_disaster` - Earthquakes, tsunamis, hurricanes
- `political` - Elections, assassinations, government changes
- `war` - Wars, battles, military conflicts
- `technology` - Technological breakthroughs, space missions
- `social` - Social movements, protests
- `pandemic` - Disease outbreaks, health crises
- `terrorism` - Terrorist attacks, bombings
- `accident` - Nuclear accidents, major disasters
- `other` - Events that don't fit other categories

### 5. Valid Event Types

Common event types include:
- `market_crash`, `stock_crash`, `recession`, `economic_boom`
- `earthquake`, `tsunami`, `hurricane`, `wildfire`
- `election`, `referendum`, `assassination`, `revolution`, `coup`
- `war`, `battle`, `invasion`, `peace_treaty`
- `terrorist_attack`, `bombing`
- `pandemic`, `disease_outbreak`
- `nuclear_accident`
- `space_mission`, `invention`, `discovery`

### 6. Example CSV Row

```csv
"9/11 World Trade Center Attack","Terrorist attacks on World Trade Center and Pentagon","2001-09-11T08:46:00Z","terrorism","terrorist_attack","extreme","New York City",40.7128,-74.0060,"US",2977,"https://example.com/911-attacks","historical_records"
```

## How to Run

### Test Mode (Validation Only)
```bash
cd backend
node seedFromCSV.js --test
```

### Full Seeding
```bash
cd backend
node seedFromCSV.js
```

### Custom File Path
```bash
cd backend
node seedFromCSV.js --file=/path/to/your/events.csv
```

## What Happens Automatically

1. **Validation**: All data is validated before insertion
2. **Astrological Calculations**: If latitude/longitude are provided, the system automatically:
   - Calculates planetary positions for the event date/time/location
   - Generates astrological data (sun, moon, planets in signs and nakshatras)
   - Calculates planetary aspects
   - Stores all astronomical data linked to the event
3. **Pattern Analysis**: The ML system can later analyze patterns in the planetary data
4. **Error Handling**: Failed events are logged with detailed error messages

## Benefits of This System

- **Automatic Astrological Enrichment**: Every event gets full planetary transit data
- **Pattern Recognition Ready**: Data is structured for ML analysis
- **Batch Processing**: Handles large datasets efficiently
- **Validation**: Ensures data quality before insertion
- **Error Recovery**: Individual failures don't stop the entire process

## Example Template

Here's a sample of how your CSV should look:

```csv
title,description,event_date,category,event_type,impact_level,location_name,latitude,longitude,country_code,affected_population,source_url,source_name
"Stock Market Crash of 1929","Black Tuesday - Wall Street crash that triggered the Great Depression","1929-10-29T00:00:00Z","financial","market_crash","extreme","New York City",40.7128,-74.0060,"US",100000000,"https://example.com/black-tuesday","historical_records"
"2008 Financial Crisis Peak","Lehman Brothers collapse triggering global financial crisis","2008-09-15T00:00:00Z","financial","market_crash","extreme","New York City",40.7128,-74.0060,"US",50000000,"https://example.com/2008-crisis","historical_records"
"COVID-19 Pandemic Declaration","WHO declares COVID-19 a global pandemic","2020-03-11T00:00:00Z","pandemic","disease_outbreak","extreme","Geneva",46.2044,6.1432,"CH",7800000000,"https://example.com/covid-pandemic","historical_records"
```

## Next Steps

1. Prepare your CSV file with major world events
2. Place it in the correct location or note the custom path
3. Run in test mode first to validate
4. Run the full seeding process
5. Your events will be automatically enriched with astrological data
6. Use the ML analytics system to find patterns

The system is designed to handle everything automatically once you provide the CSV file with the proper structure!
