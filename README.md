# Swiss Calculation Engine - Astrology API

A high-accuracy backend-only API for Vedic astrology calculations using the Swiss Ephemeris library. Provides comprehensive astrological data including birth charts (kundli), panchang, dasha periods, planetary positions, and transits.

## Features

- **Swiss Ephemeris Integration**: High-precision astronomical calculations
- **No Database Required**: Pure calculation engine with no data persistence
- **No Authentication**: Public API access for easy integration
- **Comprehensive Calculations**:
  - Birth chart generation (kundli) with planetary positions and aspects
  - Panchang (Hindu calendar) calculations
  - Vimshottari Dasha timeline and periods
  - Real-time planetary positions
  - Planetary transits for any year or month
- **RESTful API**: Clean JSON responses with consistent structure
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Comprehensive error responses and logging

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up ephemeris data if needed:
   ```bash
   ./download-ephemeris.sh
   ```

## Usage

Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3001`

Health check endpoint: `http://localhost:3001/health`

API documentation: `http://localhost:3001/`

## API Endpoints

All endpoints accept POST requests with JSON body parameters unless otherwise noted. Common required parameters:
- `date`: Birth date in YYYY-MM-DD format
- `time`: Birth time in HH:MM format (24-hour)
- `latitude`: Location latitude (-90 to 90)
- `longitude`: Location longitude (-180 to 180)
- `timezone`: Timezone string (default: "Asia/Kolkata")

Optional parameters: `name`, `place`

### Kundli (Birth Chart)

**POST** `/api/kundli`

Generates complete Vedic birth chart with planetary positions, houses, yogas, doshas, and aspects.

**Example Request:**
```json
{
  "date": "2000-09-30",
  "time": "12:00",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "timezone": "Asia/Kolkata",
  "name": "Test User",
  "place": "Kolkata"
}
```

### Panchang (Hindu Calendar)

**POST** `/api/panchang`

Calculates Panchang details (tithi, nakshatra, yoga, karana) for given date and location.

**Example Request:**
```json
{
  "date": "2000-09-30",
  "time": "12:00",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "timezone": "Asia/Kolkata"
}
```

**GET** `/api/panchang/today`

Get today's Panchang for a specific location.

**Query Parameters:** `latitude`, `longitude`, `timezone`, `place`

**POST** `/api/panchang/month`

Get Panchang for entire month.

**Example Request:**
```json
{
  "year": 2000,
  "month": 9,
  "latitude": 22.5726,
  "longitude": 88.3639,
  "timezone": "Asia/Kolkata"
}
```

### Dasha (Planetary Periods)

**POST** `/api/dasha`

Calculate Vimshottari Dasha timeline for birth details.

**Example Request:**
```json
{
  "birthDate": "2000-09-30",
  "birthTime": "12:00",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "timezone": "Asia/Kolkata",
  "name": "Test User"
}
```

**POST** `/api/dasha/detailed`

Get detailed Dasha with sub-periods (Antardasha, Pratyantardasha).

**Additional Parameters:** `includeSubPeriods` (boolean), `includePratyantardasha` (boolean)

**POST** `/api/dasha/current`

Get only current Mahadasha and Antardasha.

**GET** `/api/dasha/periods`

Get standard Vimshottari Dasha periods reference (no request body required).

### Planetary Positions

**POST** `/api/planetary-positions`

Get current planetary positions for any date, time, and location.

**Example Request:**
```json
{
  "date": "2000-09-30",
  "time": "12:00",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "timezone": "Asia/Kolkata"
}
```

### Transits

**POST** `/api/transits`

Calculate planetary transits for a given year.

**Example Request:**
```json
{
  "year": 2024,
  "timezone": "Asia/Kolkata"
}
```

**POST** `/api/transits/month`

Calculate transit data for specific month.

**Example Request:**
```json
{
  "month": 9,
  "year": 2024,
  "timezone": "Asia/Kolkata"
}
```

## Example Responses

### Kundli Response
```json
{
  "success": true,
  "data": {
    "birthDetails": {
      "name": "Test User",
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
            "degrees": ["15°23'"]
          }
        ]
      },
      "navamsa": {
        "houses": [
          {
            "number": 1,
            "sign": "Aquarius",
            "planets": ["Saturn"],
            "degrees": ["8°45'"]
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

### Planetary Positions Response
```json
{
  "success": true,
  "data": {
    "date": "2000-09-30",
    "time": "12:00",
    "location": {
      "latitude": 22.5726,
      "longitude": 88.3639,
      "timezone": "Asia/Kolkata"
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
    "ascendant": {
      "sign": "Libra",
      "degree": 15.38,
      "longitude": 195.38
    },
    "aspects": {
      "planetaryAspects": [],
      "houseAspects": {},
      "strongestAspects": [],
      "summary": {
        "totalPlanetaryAspects": 0,
        "planetsWithHouseAspects": 0,
        "rahuKetuSpecialAspectsEnabled": false
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Dasha Response
```json
{
  "success": true,
  "data": {
    "birthDetails": {
      "name": "Test User",
      "date": "2000-09-30",
      "time": "12:00",
      "place": "22.5726°N, 88.3639°E",
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

## Deployment

### Railway/Nixpacks

This backend is optimized for deployment on Railway using Nixpacks:

1. Connect your GitHub repository to Railway
2. Set environment variables if needed (see `.env.example`)
3. Deploy - Nixpacks will automatically detect Node.js and install dependencies
4. The app will run on the default Railway port

### Backend-Only Architecture

- No frontend components
- No database connections required
- All calculations are performed in-memory
- Stateless design for easy scaling

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### API Testing
Use tools like Postman, curl, or any HTTP client to test endpoints.

Example test command:
```bash
curl -X POST http://localhost:3001/api/planetary-positions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2000-09-30",
    "time": "12:00",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "timezone": "Asia/Kolkata"
  }'
```

### Verification Steps
1. Check server logs for successful startup
2. Verify health endpoint returns status "healthy"
3. Test a simple endpoint like planetary positions
4. Confirm calculations match expected astronomical data

## Architecture

### Backend-Only Design
- **No Frontend**: Pure API server
- **No Database**: Calculations only, no data storage
- **Microservices Ready**: Modular service architecture
- **Swiss Ephemeris**: Core astronomical calculation engine
- **Fallback Systems**: Astronomy Engine as backup for Swiss Ephemeris

### Key Components
- **Routes**: API endpoint definitions
- **Controllers**: Request handling and response formatting
- **Services**: Business logic and calculations
  - `enhancedSwissEphemeris.js`: Primary calculation engine
  - `astronomyEngine.js`: Fallback calculation engine
  - `dashaService.js`: Dasha period calculations
  - `panchangService.js`: Hindu calendar calculations
  - `aspectsService.js`: Planetary aspect calculations
- **Utils**: Helper functions and utilities

### Technologies
- Node.js with Express.js framework
- Swiss Ephemeris (swisseph) for astronomical calculations
- Astronomy Engine as fallback
- Winston for logging
- Joi for input validation
- Rate limiting and security middleware

## Contributing & Future Enhancements

### Current Status
- Core calculation engine is stable and production-ready
- All major Vedic astrology calculations implemented
- Comprehensive error handling and logging

### Potential Additions
- Additional dasha systems (Ashtottari, Yogini)
- More detailed aspect calculations
- Transit predictions and alerts
- Historical event correlation
- Advanced yoga and dosha analysis
- Mobile app API optimizations

### Code Quality
- History cleanup needed for production deployment
- Additional test coverage recommended
- Documentation improvements ongoing

---

**Note**: This API provides astronomical calculations for educational and research purposes. Always consult qualified astrologers for personal astrological advice.