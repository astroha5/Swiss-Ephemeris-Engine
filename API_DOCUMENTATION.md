# Swiss Calculation Engine API Documentation

## 1 Overview

The Swiss Calculation Engine provides accurate astrological calculations using the Swiss Ephemeris library. This API returns raw astronomical data for planetary positions, house cusps, and ascendant calculations in both tropical and sidereal (Vedic) systems.

**Base URL:** `https://swiss-ephemeris-engine.onrender.com`

## 🌟 Key Features

- ✅ **Accurate Sidereal Calculations** - Proper ayanamsa correction for Vedic astrology
- ✅ **Multiple House Systems** - Placidus, Koch, Equal, Whole Sign, and more
- ✅ **Timezone Aware** - Handles both UTC and local time inputs
- ✅ **JSON Output** - Clean, structured data for easy integration
- ✅ **Multiple Ayanamsa** - Lahiri, Raman, Krishnamurti, and others

## 📚 Quick Start

### Basic House Calculation
```bash
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=28.6139&lon=77.2090&tropical=false"
```

### Planetary Positions
```bash
curl "https://swiss-ephemeris-engine.onrender.com/v1/planets?datetime=2000-09-30T06:30:00Z&tropical=false"
```

## 🕐 **IMPORTANT: Timezone Handling**

⚠️ **Critical for Accurate Results:** Birth times in astrology are typically recorded in **local time**, not UTC. Incorrect timezone interpretation can shift your ascendant by several signs!

### ✅ **Recommended Approach: Convert to UTC**

For maximum accuracy, convert your local birth time to UTC before calling the API.

#### **Examples by Location:**

**India (UTC+5:30):**
```bash
# Birth: Sep 30, 2000, 12:00 PM IST (Kolkata)
# UTC equivalent: 06:30 UTC
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=22.5726&lon=88.3639&tropical=false"
# Result: Sagittarius ascendant ✅
```

**USA East Coast (UTC-5 in winter, UTC-4 in summer):**
```bash
# Birth: Dec 25, 2000, 2:00 PM EST (New York)
# UTC equivalent: 19:00 UTC
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-12-25T19:00:00Z&lat=40.7128&lon=-74.0060&tropical=false"
```

**UK (UTC+0 in winter, UTC+1 in summer):**
```bash
# Birth: Jun 15, 2000, 3:00 PM BST (London)  
# UTC equivalent: 14:00 UTC
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-06-15T14:00:00Z&lat=51.5074&lon=-0.1278&tropical=false"
```

### 🛠 **Timezone Conversion Tools**

**Online Tools:**
- [TimeandDate.com](https://www.timeanddate.com/worldclock/converter.html)
- [World Clock Pro](https://24timezones.com/timezone-converter)

**Programming:**
```javascript
// JavaScript example
const localTime = new Date('2000-09-30T12:00:00'); // Local time
const utcTime = localTime.toISOString(); // Converts to UTC
console.log(utcTime); // "2000-09-30T12:00:00.000Z" (if browser is in UTC)
```

```python
# Python example
from datetime import datetime
import pytz

# Convert Kolkata time to UTC
kolkata_tz = pytz.timezone('Asia/Kolkata')
local_time = kolkata_tz.localize(datetime(2000, 9, 30, 12, 0, 0))
utc_time = local_time.astimezone(pytz.UTC)
print(utc_time.isoformat())  # "2000-09-30T06:30:00+00:00"
```

## 🏠 Houses Endpoint

**`GET /v1/houses`**

Calculate house cusps, ascendant, MC, and other angles.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | ✅ | - | ISO 8601 timestamp (preferably UTC) |
| `lat` | number | ✅ | - | Latitude in decimal degrees (North positive) |
| `lon` | number | ✅ | - | Longitude in decimal degrees (East positive) |
| `tropical` | boolean | ❌ | `false` | `true` for tropical, `false` for sidereal/Vedic |
| `hsys` | string | ❌ | `"P"` | House system: `P`=Placidus, `K`=Koch, `E`=Equal, `W`=Whole Sign |
| `ayanamsa` | integer | ❌ | `1` | Ayanamsa: `1`=Lahiri, `3`=Raman, `5`=Krishnamurti |

### Example Response
```json
{
  "julian_day": 2451817.7708333335,
  "tropical": false,
  "ayanamsa_id": 1,
  "houses": {
    "cusps": [250.57, 280.23, 310.45, 341.12, 11.89, 42.67, 70.57, 100.23, 130.45, 161.12, 191.89, 222.67],
    "ascendant": 250.56627221561695,
    "mc": 161.43372778438305,
    "vertex": 247.42613148070467
  },
  "backend": "SWIEPH"
}
```

### Interpreting Results

**Ascendant Sign Calculation:**
```javascript
const ascendant = 250.57; // degrees
const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
               "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const signIndex = Math.floor(ascendant / 30);
const degreeInSign = ascendant % 30;
console.log(`${signs[signIndex]} ${degreeInSign.toFixed(2)}°`); // "Sagittarius 10.57°"
```

## 🪐 Planets Endpoint

**`GET /v1/planets`**

Calculate planetary positions including Rahu and Ketu.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | ✅ | - | ISO 8601 timestamp (preferably UTC) |
| `tropical` | boolean | ❌ | `false` | `true` for tropical, `false` for sidereal/Vedic |
| `ayanamsa` | integer | ❌ | `1` | Ayanamsa system (1=Lahiri) |
| `node` | string | ❌ | `"true"` | `"true"` for True Node (Rahu), `"mean"` for Mean Node |
| `latitude` | number | ❌ | - | For topocentric calculations |
| `longitude` | number | ❌ | - | For topocentric calculations |

### Example Response
```json
{
  "julian_day": 2451817.7708333335,
  "tropical": false,
  "ayanamsa_id": 1,
  "backend": "SWIEPH",
  "planets": {
    "Sun": {
      "longitude": 163.42,
      "latitude": 0.00,
      "distance": 1.0034,
      "speed_longitude": 1.0194,
      "is_retrograde": false
    },
    "Moon": {
      "longitude": 197.23,
      "latitude": -4.85,
      "distance": 0.0026,
      "speed_longitude": 13.4567,
      "is_retrograde": false
    },
    "Rahu": {
      "longitude": 45.67,
      "latitude": 0.0,
      "distance": 0.0,
      "speed_longitude": -0.0529,
      "is_retrograde": true
    },
    "Ketu": {
      "longitude": 225.67,
      "latitude": 0.0
    }
  }
}
```

## 🔧 Additional Endpoints

### Julian Day Conversion
```bash
GET /v1/julian-day?datetime=2000-09-30T06:30:00Z
```

### Ayanamsa Value
```bash
GET /v1/ayanamsa?datetime=2000-09-30T06:30:00Z&ayanamsa=1
```

### Health Check
```bash
GET /health
```

## 🎯 **Common Use Cases**

### Vedic Astrology Birth Chart
```bash
# Complete birth chart data
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=1990-05-15T08:30:00Z&lat=19.0760&lon=72.8777&tropical=false&hsys=W" 

curl "https://swiss-ephemeris-engine.onrender.com/v1/planets?datetime=1990-05-15T08:30:00Z&tropical=false&node=true"
```

### Western Astrology Chart
```bash
# Tropical calculations with Placidus houses
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=1990-05-15T08:30:00Z&lat=40.7128&lon=-74.0060&tropical=true&hsys=P"
```

### Prasna (Horary) Chart
```bash
# Current moment calculation
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=$(date -u +%Y-%m-%dT%H:%M:%SZ)&lat=YOUR_LAT&lon=YOUR_LON&tropical=false"
```

## ⚠️ **Important Notes**

### Accuracy Considerations
- **Timezone is crucial** - Wrong timezone can shift ascendant by multiple signs
- **Coordinate precision** - Use at least 4 decimal places for coordinates
- **Time precision** - Birth time accuracy affects house cusps and ascendant

### Ayanamsa Systems
| ID | Name | Description |
|----|------|-------------|
| 1 | Lahiri | Most common in Indian astrology |
| 3 | Raman | Alternative Indian system |
| 5 | Krishnamurti | KP system |
| 27 | True Chitra | Fixed star based |

### House Systems
| Code | Name | Best For |
|------|------|----------|
| P | Placidus | Western astrology (most common) |
| K | Koch | Alternative Western system |
| E | Equal | Simple 30° houses |
| W | Whole Sign | Ancient/Vedic tradition |
| C | Campanus | Medieval system |

## 🆘 **Troubleshooting**

### Common Issues

**❌ Wrong Ascendant Sign**
- **Cause:** Incorrect timezone handling
- **Solution:** Convert local birth time to UTC first

**❌ "400 Bad Request" Error**
- **Cause:** Invalid datetime format
- **Solution:** Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`

**❌ Unexpected Planetary Positions**
- **Cause:** Using tropical when you need sidereal (or vice versa)
- **Solution:** Set `tropical=false` for Vedic/sidereal calculations

### Getting Help

For technical issues or questions:
1. Check this documentation first
2. Verify your timezone conversion
3. Test with known birth data
4. Open an issue on [GitHub](https://github.com/richardbelll9/Swiss-Calculation-Engine)

## 🏷️ **Version & Credits**

- **Version:** 1.0.0
- **Swiss Ephemeris:** Astrodienst AG
- **Precision:** JPL ephemeris accuracy
- **License:** AGPL v3.0

---

*Happy calculating! 🌟*
