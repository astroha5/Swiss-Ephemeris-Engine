# 🚀 Swiss Calculation Engine - Quick Reference

## ⚡ TL;DR - Get Perfect Results

**For Vedic/Sidereal Astrology:**
```bash
# Convert your local birth time to UTC first, then:
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=YYYY-MM-DDTHH:MM:SSZ&lat=LAT&lon=LON&tropical=false"
```

**For Western/Tropical Astrology:**
```bash
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=YYYY-MM-DDTHH:MM:SSZ&lat=LAT&lon=LON&tropical=true"
```

## 🕐 Timezone Conversion Examples

| Location | Local Time | UTC Time | API Call |
|----------|------------|----------|----------|
| **India (Kolkata)** | 2000-09-30 12:00 IST | 2000-09-30 06:30 UTC | `datetime=2000-09-30T06:30:00Z` |
| **USA (New York)** | 2000-12-25 14:00 EST | 2000-12-25 19:00 UTC | `datetime=2000-12-25T19:00:00Z` |
| **UK (London)** | 2000-06-15 15:00 BST | 2000-06-15 14:00 UTC | `datetime=2000-06-15T14:00:00Z` |

## 🎯 Common Parameters

| Parameter | Vedic | Western | Description |
|-----------|--------|---------|-------------|
| `tropical` | `false` | `true` | Zodiac system |
| `hsys` | `W` | `P` | W=Whole Sign, P=Placidus |
| `ayanamsa` | `1` | N/A | 1=Lahiri (most common) |

## 📊 Result Interpretation

**Convert degrees to zodiac sign:**
```javascript
const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const signIndex = Math.floor(degrees / 30);
const degreeInSign = degrees % 30;
console.log(`${signs[signIndex]} ${degreeInSign.toFixed(2)}°`);
```

## ⚠️ Common Mistakes

❌ **Using local time without conversion**
```bash
# WRONG - Will give incorrect ascendant
curl "...?datetime=2000-09-30T12:00:00&..."
```

✅ **Converting to UTC first**
```bash
# CORRECT - Accurate results
curl "...?datetime=2000-09-30T06:30:00Z&..."
```

## 🛠 Quick Timezone Conversion

**Online:** [TimeandDate.com Converter](https://www.timeanddate.com/worldclock/converter.html)

**JavaScript:**
```javascript
// If you have timezone info
const localTime = new Date('2000-09-30T12:00:00+05:30'); // IST
const utcTime = localTime.toISOString(); // Auto-converts to UTC
```

**Python:**
```python
import pytz
from datetime import datetime

# Convert any timezone to UTC
tz = pytz.timezone('Asia/Kolkata')
local = tz.localize(datetime(2000, 9, 30, 12, 0))
utc = local.astimezone(pytz.UTC)
print(utc.strftime('%Y-%m-%dT%H:%M:%SZ'))
```

## 🎉 Test Your Setup

**Expected Result for Test Case:**
- Birth: Sep 30, 2000, 12:00 PM in Kolkata, India
- Should return: **Sagittarius ascendant** (~250.57°)

```bash
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=22.5726459&lon=88.3638953&tropical=false"
# Should show ascendant around 250° (Sagittarius)
```

## 📞 Support

- 📖 [Full Documentation](./API_DOCUMENTATION.md)
- 🐛 [GitHub Issues](https://github.com/richardbelll9/Swiss-Calculation-Engine/issues)
- 💡 [Stack Overflow](https://stackoverflow.com/questions/tagged/swiss-ephemeris)

---
*For detailed information, see the [complete API documentation](./API_DOCUMENTATION.md)*
