# Swiss Ephemeris Setup Guide

The Astrova backend uses Swiss Ephemeris for high-precision astronomical calculations. While the backend can work with built-in approximations, downloading the official ephemeris files will provide maximum accuracy.

## Quick Setup (Built-in Approximations)

Your backend is already configured to work with built-in Swiss Ephemeris data for common date ranges (approximately 1900-2100). This is sufficient for most Vedic astrology calculations.

**No additional setup required for basic functionality.**

## Enhanced Setup (Maximum Accuracy)

For maximum accuracy and extended date range coverage, follow these steps:

### Option 1: Automatic Download (Recommended)

Run the automated download script:

```bash
cd backend
./download-ephemeris.sh
```

### Option 2: Manual Download

If automatic download fails, manually download ephemeris files:

1. **Visit the Swiss Ephemeris FTP site:**
   - Primary: https://www.astro.com/ftp/swisseph/ephe/
   - Mirror: ftp://ftp.astro.com/pub/swisseph/ephe/

2. **Download essential files for your date range:**

   **For years 1800-2200 (recommended minimum):**
   ```
   sepl_06.se1  # Planets 1800-1900
   sepl_12.se1  # Planets 1900-2000  
   sepl_18.se1  # Planets 2000-2100
   semo_06.se1  # Moon 1800-1900
   semo_12.se1  # Moon 1900-2000
   semo_18.se1  # Moon 2000-2100
   ```

   **For extended coverage (600-2200):**
   ```
   sepl_*.se1   # All planet files
   semo_*.se1   # All moon files
   seas_*.se1   # Asteroid files (optional)
   ```

3. **Place files in the ephemeris directory:**
   ```bash
   cp downloaded_files/* backend/ephemeris/
   ```

### Option 3: Alternative Sources

If official sources are unavailable, try these community mirrors:

```bash
# GitHub mirror (may have limited files)
curl -L -o ephemeris/sepl_18.se1 \
  "https://raw.githubusercontent.com/astronexus/swisseph/master/ephe/sepl_18.se1"

# Check file integrity
file ephemeris/sepl_18.se1  # Should show "data" not "ASCII text"
```

## Verification

Test your setup:

```bash
cd backend
npm install
npm run dev
```

Check the logs for:
- ✅ `Swiss Ephemeris path set to: .../ephemeris`
- ✅ `Swiss Ephemeris service initialized`

## Date Range Coverage

| File Pattern | Date Range | Description |
|--------------|------------|-------------|
| `*_06.se1`   | 1800-1900  | 19th century |
| `*_12.se1`   | 1900-2000  | 20th century |
| `*_18.se1`   | 2000-2100  | 21st century |
| `*_24.se1`   | 2100-2200  | 22nd century |

## File Types

- **`sepl_*.se1`**: Planet positions (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn)
- **`semo_*.se1`**: High-precision Moon positions
- **`seas_*.se1`**: Asteroid and minor planet positions
- **`seorbel.se1`**: Orbital elements

## Troubleshooting

### "Failed to calculate positions" errors:
- Ensure ephemeris files are binary (not HTML/text)
- Check date is within file coverage range
- Verify file permissions are readable

### Network download issues:
- Try different mirror sites
- Use VPN if geographic restrictions apply
- Download via web browser if curl/wget fails

### Built-in data limitations:
- Reduced accuracy for historical dates (before 1850)
- Some minor planets may not be available
- Asteroid positions may be approximated

## Support

For issues with:
- **Ephemeris files**: https://www.astro.com/swisseph/
- **Backend setup**: Check the main README.md
- **API usage**: Visit http://localhost:3001/ when running

Your Astrova backend will work immediately with built-in data, but enhanced accuracy comes with proper ephemeris files.
