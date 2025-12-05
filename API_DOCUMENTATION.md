# Swiss Calculation Engine - Astrology API Documentation

## Introduction

The Swiss Calculation Engine provides a comprehensive REST API for Vedic astrology calculations using high-precision astronomical data from the Swiss Ephemeris library. This API offers accurate birth chart generation, panchang calculations, dasha periods, planetary positions, and transit analysis without requiring authentication.

The API is designed for developers building astrology applications, research tools, or integrating astrological calculations into existing systems. All calculations are performed in real-time with no data storage or persistence.

## Base URL

```
https://swiss-ephemeris-engine-production.up.railway.app/
```

## Authentication

No authentication is required. The API is publicly accessible for easy integration.

## Common Parameters

All endpoints that require birth or location data use the following standard parameters:

### Required Parameters
- `date`: Birth date in YYYY-MM-DD format (e.g., "2000-09-30")
- `time`: Birth time in 24-hour HH:MM format (e.g., "12:00")
- `latitude`: Location latitude as a number between -90 and 90 (e.g., 22.5726)
- `longitude`: Location longitude as a number between -180 and 180 (e.g., 88.3639)

### Optional Parameters
- `timezone`: Timezone string (default: "Asia/Kolkata")
- `name`: Person's name for reference
- `place`: Location name for reference

## Rate Limiting

The API includes built-in rate limiting to prevent abuse. Specific limits are not publicly documented but are designed to allow reasonable usage for development and production applications. If you encounter rate limiting, implement exponential backoff in your client applications.

## Error Handling

The API uses standard HTTP status codes and returns consistent error response formats.

### Common Error Codes

- **400 Bad Request**: Invalid input parameters or missing required fields
- **500 Internal Server Error**: Server-side calculation errors or unexpected failures

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description",
  "message": "Detailed error information"
}
```

## Endpoint Documentation

### 1. Health Check

**GET** `/health`

Simple health check endpoint to verify API availability.

**Parameters:** None

**Example Request:**
```bash
curl https://swiss-ephemeris-engine-production.up.railway.app/health
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Kundli (Birth Chart)

**POST** `/api/kundli`

Generates a complete Vedic birth chart including planetary positions, houses, yogas, doshas, aspects, and dasha information.

**Parameters:**
- All common parameters (date, time, latitude, longitude, timezone, name, place)

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/kundli \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2000-09-30",
    "time": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata",
    "name": "Rahul Jana",
    "place": "Kolkata"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "birthDetails": {
      "name": "Rahul Jana",
      "dateOfBirth": "2000-09-30",
      "timeOfBirth": "12:00",
      "placeOfBirth": "Kolkata",
      "latitude": "22.5726",
      "longitude": "88.3639",
      "timezone": "Asia/Kolkata"
    },
    "chartSummary": {
      "ascendant": {
        "sign": "Libra",
        "degree": "15°23'",
        "lord": "Venus",
        "nakshatra": "Swati"
      },
      "moonSign": {
        "sign": "Pisces",
        "degree": "12°45'",
        "lord": "Jupiter",
        "nakshatra": "Uttara Bhadrapada"
      },
      "sunSign": {
        "sign": "Virgo",
        "degree": "14°12'",
        "lord": "Mercury",
        "nakshatra": "Hasta"
      },
      "yogas": [],
      "doshas": [],
      "currentDasha": {
        "planet": "Saturn",
        "startDate": "2000-09-30",
        "endDate": "2019-09-30",
        "remainingYears": 0,
        "lord": "Saturn"
      },
      "currentAntardasha": {
        "planet": "Mercury",
        "startDate": "2016-01-15",
        "endDate": "2017-09-15",
        "remainingYears": 0,
        "lord": "Mercury"
      },
      "vimshottariDasha": {
        "birthDetails": {
          "birthDashaLord": "Saturn"
        },
        "currentMahadasha": {
          "planet": "Saturn",
          "startDate": "2000-09-30",
          "endDate": "2019-09-30",
          "remainingYears": 0,
          "lord": "Saturn"
        },
        "currentAntardasha": {
          "planet": "Mercury",
          "startDate": "2016-01-15",
          "endDate": "2017-09-15",
          "remainingYears": 0,
          "lord": "Mercury"
        }
      }
    },
    "planetaryData": [
      {
        "planet": "Sun",
        "symbol": "☉",
        "sign": "Virgo",
        "house": 6,
        "degree": "14°12'",
        "nakshatra": "Hasta",
        "pada": 2,
        "retrograde": false,
        "strength": "Medium",
        "nature": "Benefic"
      },
      {
        "planet": "Moon",
        "symbol": "☽",
        "sign": "Pisces",
        "house": 12,
        "degree": "12°45'",
        "nakshatra": "Uttara Bhadrapada",
        "pada": 3,
        "retrograde": false,
        "strength": "Strong",
        "nature": "Benefic"
      }
    ],
    "charts": {
      "lagna": {
        "houses": [
          {
            "number": 1,
            "sign": "Libra",
            "planets": ["Venus"],
            "degrees": ["15°23'"],
            "signLord": "Venus"
          }
        ]
      },
      "navamsa": {
        "houses": [
          {
            "number": 1,
            "sign": "Aquarius",
            "planets": ["Saturn"],
            "degrees": ["8°45'"],
            "signLord": "Saturn"
          }
        ]
      }
    },
    "aspects": {
      "planetaryAspects": [
        {
          "aspectingPlanet": "Jupiter",
          "aspectedPlanet": "Mars",
          "aspectType": "Trine",
          "orb": 2.3,
          "strength": "Strong"
        }
      ],
      "houseAspects": {},
      "strongestAspects": [],
      "summary": {
        "totalPlanetaryAspects": 8,
        "planetsWithHouseAspects": 0,
        "rahuKetuSpecialAspectsEnabled": false
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Planetary Positions

**POST** `/api/planetary-positions`

Calculates current planetary positions for any given date, time, and location.

**Parameters:**
- All common parameters (date, time, latitude, longitude, timezone)
- `zodiac` (optional): "tropical" or "sidereal" (default: "sidereal")

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/planetary-positions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2000-09-30",
    "time": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "requestInfo": {
      "date": "2000-09-30",
      "time": "12:00",
      "latitude": 22.5726,
      "longitude": 88.3639,
      "timezone": "Asia/Kolkata",
      "julianDay": 2451798.2083333335
    },
    "ascendant": {
      "degree": 15.38,
      "sign": "Libra",
      "nakshatra": "Swati",
      "formatted": "15°23'"
    },
    "planets": [
      {
        "name": "Sun",
        "degree": 14.2,
        "sign": "Virgo",
        "nakshatra": "Hasta",
        "isRetrograde": false,
        "formatted": "14°12'",
        "longitude": 164.2,
        "house": 6
      },
      {
        "name": "Moon",
        "degree": 12.75,
        "sign": "Pisces",
        "nakshatra": "Uttara Bhadrapada",
        "isRetrograde": false,
        "formatted": "12°45'",
        "longitude": 342.75,
        "house": 12
      },
      {
        "name": "Mars",
        "degree": 23.8,
        "sign": "Leo",
        "nakshatra": "Purva Phalguni",
        "isRetrograde": true,
        "formatted": "23°48'",
        "longitude": 143.8,
        "house": 5
      }
    ],
    "aspects": {
      "planetaryAspects": [],
      "houseAspects": {},
      "strongestAspects": [],
      "summary": {
        "totalPlanetaryAspects": 0,
        "planetsWithHouseAspects": 0,
        "rahuKetuSpecialAspectsEnabled": false
      }
    },
    "charts": {
      "lagna": {
        "houses": [],
        "ascendant": {
          "degree": 15.38,
          "sign": "Libra",
          "nakshatra": "Swati",
          "formatted": "15°23'"
        },
        "planets": {}
      }
    }
  }
}
```

### 4. Dasha (Planetary Periods)

#### Basic Dasha Timeline

**POST** `/api/dasha`

Calculates the complete Vimshottari Dasha timeline for birth details.

**Parameters:**
- `birthDate`: Birth date in YYYY-MM-DD format
- `birthTime`: Birth time in HH:MM format
- `latitude`: Location latitude (-90 to 90)
- `longitude`: Location longitude (-180 to 180)
- `timezone` (optional): Timezone string (default: "Asia/Kolkata")
- `name` (optional): Person's name
- `place` (optional): Location name

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/dasha \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": "2000-09-30",
    "birthTime": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata",
    "name": "Rahul Jana",
    "place": "Kolkata"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "birthDetails": {
      "name": "Rahul Jana",
      "date": "2000-09-30",
      "time": "12:00",
      "place": "Kolkata",
      "moonNakshatra": "Uttara Bhadrapada",
      "birthDashaLord": "Saturn"
    },
    "currentMahadasha": {
      "planet": "Saturn",
      "startDate": "2000-09-30",
      "endDate": "2019-09-30",
      "remainingYears": 0,
      "lord": "Saturn"
    },
    "currentAntardasha": {
      "planet": "Mercury",
      "startDate": "2016-01-15",
      "endDate": "2017-09-15",
      "remainingYears": 0,
      "lord": "Mercury"
    },
    "dashaSequence": [
      {
        "planet": "Saturn",
        "years": 19,
        "startDate": "2000-09-30",
        "endDate": "2019-09-30"
      },
      {
        "planet": "Mercury",
        "years": 17,
        "startDate": "2019-09-30",
        "endDate": "2036-09-30"
      }
    ],
    "timeline": [],
    "coordinates": {
      "latitude": 22.5726,
      "longitude": 88.3639,
      "timezone": "Asia/Kolkata"
    },
    "calculatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Detailed Dasha

**POST** `/api/dasha/detailed`

Get detailed Dasha with sub-periods.

**Additional Parameters:**
- `includeSubPeriods` (optional): Include Antardasha periods (default: true)
- `includePratyantardasha` (optional): Include Pratyantardasha periods (default: false)

#### Current Dasha Only

**POST** `/api/dasha/current`

Returns only the current Mahadasha and Antardasha periods.

**Parameters:** Same as basic dasha endpoint

#### Dasha Periods Reference

**GET** `/api/dasha/periods`

Returns the standard Vimshottari Dasha period durations for reference.

**Parameters:** None

**Example Response:**
```json
{
  "success": true,
  "data": {
    "periods": {
      "Ketu": 7,
      "Venus": 20,
      "Sun": 6,
      "Moon": 10,
      "Mars": 7,
      "Rahu": 18,
      "Jupiter": 16,
      "Saturn": 19,
      "Mercury": 17
    },
    "sequence": ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
    "totalCycle": 120,
    "description": "Vimshottari Dasha system - 120-year planetary cycle",
    "note": "Each planet rules for the specified number of years in the given sequence"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. Panchang (Hindu Calendar)

#### Panchang for Specific Date/Time

**POST** `/api/panchang`

Calculates Panchang details (tithi, nakshatra, yoga, karana) for given date and location.

**Parameters:**
- All common parameters (date, time, latitude, longitude, timezone, place)

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/panchang \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2000-09-30",
    "time": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata",
    "place": "Kolkata"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Kolkata",
      "coordinates": {
        "latitude": 22.5726,
        "longitude": 88.3639,
        "timezone": "Asia/Kolkata"
      }
    },
    "date": "2000-09-30",
    "panchang": {
      "tithi": {
        "name": "Shukla Paksha Tritiya",
        "number": 3,
        "paksha": "Shukla",
        "endTime": "2024-01-15T18:30:00.000Z"
      },
      "nakshatra": {
        "name": "Hasta",
        "number": 13,
        "ruler": "Moon",
        "endTime": "2024-01-15T16:45:00.000Z"
      },
      "yoga": {
        "name": "Siddha",
        "number": 18,
        "endTime": "2024-01-15T14:20:00.000Z"
      },
      "karana": {
        "name": "Vanija",
        "number": 4,
        "endTime": "2024-01-15T12:15:00.000Z"
      }
    },
    "sunTimes": {
      "sunrise": "2024-01-15T06:30:00.000Z",
      "sunset": "2024-01-15T17:45:00.000Z",
      "solarNoon": "2024-01-15T12:07:00.000Z"
    },
    "additionalInfo": {
      "rahukalam": "2024-01-15T13:30:00.000Z",
      "yamagandam": "2024-01-15T10:15:00.000Z"
    },
    "calculatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Today's Panchang

**GET** `/api/panchang/today`

Get today's Panchang for a specific location.

**Query Parameters:**
- `latitude`: Required
- `longitude`: Required
- `timezone` (optional): Default "Asia/Kolkata"
- `place` (optional): Location name

**Example Request:**
```bash
curl "https://swiss-ephemeris-engine-production.up.railway.app/api/panchang/today?latitude=22.5726&longitude=88.3639&timezone=Asia/Kolkata&place=Kolkata"
```

#### Monthly Panchang

**POST** `/api/panchang/month`

Get Panchang for entire month.

**Parameters:**
- `year`: Year (1900-2100)
- `month`: Month (1-12)
- `latitude`: Location latitude
- `longitude`: Location longitude
- `timezone` (optional): Default "Asia/Kolkata"

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/panchang/month \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2000,
    "month": 9,
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata"
  }'
```

### 6. Transits

#### Yearly Transits

**POST** `/api/transits`

Calculate planetary transits for a given year.

**Parameters:**
- `year` (optional): Year to calculate (default: current year)
- `timezone` (optional): Timezone (default: "UTC")

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/transits \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "timezone": "Asia/Kolkata"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "transits": [
      {
        "planet": "Jupiter",
        "ingressDate": "2024-05-16",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "nakshatra": "Rohini",
        "nakshatraPada": 2,
        "degreeInSign": 0.5,
        "isRetrograde": false,
        "duration": "1 year",
        "significance": "high"
      }
    ],
    "majorHighlights": [
      {
        "planet": "Saturn",
        "ingressDate": "2024-03-08",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "isMajor": true,
        "description": "Saturn in Pisces brings lessons in emotional maturity and family duties."
      }
    ],
    "mercuryRetrogrades": [
      {
        "planet": "Mercury",
        "date": "2024-04-01",
        "type": "retrograde_start",
        "sign": "Aries",
        "degree": 27.5
      }
    ],
    "calculatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Monthly Transits

**POST** `/api/transits/month`

Calculate transit data for specific month.

**Parameters:**
- `month`: Month (1-12)
- `year` (optional): Year (default: current year)
- `timezone` (optional): Timezone (default: "UTC")

**Example Request:**
```bash
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/transits/month \
  -H "Content-Type: application/json" \
  -d '{
    "month": 9,
    "year": 2024,
    "timezone": "Asia/Kolkata"
  }'
```

## SDK/Libraries

The API uses standard REST conventions and can be consumed by any HTTP client. Recommended approaches:

- **JavaScript/Node.js**: Native `fetch()` API or `axios` library
- **Python**: `requests` library
- **Java**: `OkHttp` or `Apache HttpClient`
- **cURL**: Command-line tool for testing
- **Postman/Insomnia**: GUI tools for API testing

No official SDKs are currently provided, but the API follows REST standards making integration straightforward with any modern programming language.

## Examples

### Complete Kundli Generation

```javascript
const kundliData = {
  date: "2000-09-30",
  time: "12:00",
  latitude: 22.5726,
  longitude: 88.3639,
  timezone: "Asia/Kolkata",
  name: "Rahul Jana",
  place: "Kolkata"
};

fetch('https://swiss-ephemeris-engine-production.up.railway.app/api/kundli', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(kundliData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Birth Chart:', data.data);
  } else {
    console.error('Error:', data.error);
  }
});
```

### Planetary Positions Query

```python
import requests

planetary_data = {
    "date": "2000-09-30",
    "time": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata"
}

response = requests.post(
    'https://swiss-ephemeris-engine-production.up.railway.app/api/planetary-positions',
    json=planetary_data
)

if response.status_code == 200:
    data = response.json()
    if data['success']:
        print("Planetary positions:", data['data']['planets'])
    else:
        print("Error:", data['error'])
```

### Dasha Calculation

```bash
# Get current Dasha periods
curl -X POST https://swiss-ephemeris-engine-production.up.railway.app/api/dasha/current \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": "2000-09-30",
    "birthTime": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata"
  }'
```

### Panchang for Today

```bash
# Get today's Panchang
curl "https://swiss-ephemeris-engine-production.up.railway.app/api/panchang/today?latitude=22.5726&longitude=88.3639&place=Kolkata"
```

---

**Note**: This API provides astronomical calculations for educational and research purposes. Always consult qualified astrologers for personal astrological advice.