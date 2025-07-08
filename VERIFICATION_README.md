# Astrova Chart Verification Suite

This comprehensive verification suite tests Barack Obama's birth chart against multiple astrology calculation sources to determine if issues are with your implementation or reference data.

## Quick Start

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Run the main verification:**
   ```bash
   node run_verification.js
   ```

## Available Scripts

### 1. Main Verification Runner
```bash
node run_verification.js
```
- Tests your Astrova implementation against Swiss Ephemeris
- Compares with existing batch tests
- Provides detailed analysis

### 2. Full Verification Suite
```bash
node run_verification.js --full
```
- Installs required dependencies automatically
- Attempts to fetch online reference data
- Runs comprehensive verification tests
- **Recommended for complete analysis**

### 3. Backend Status Check
```bash
node run_verification.js --backend
```
- Checks if your backend is running
- Tests a quick API call with Obama's data
- Useful for debugging connection issues

### 4. Online Reference Fetcher
```bash
node run_verification.js --online
```
- Attempts to fetch reference data from online sources
- Requires additional dependencies (installed automatically)
- May not work due to anti-scraping measures

## Individual Scripts

### reference_verification_script.js
The main verification script that:
- Tests Swiss Ephemeris directly with multiple Ayanamsa systems
- Calls your Astrova API
- Compares results with known reference values
- Provides detailed analysis and recommendations

### online_reference_fetcher.js
Attempts to gather reference data from:
- AstroSeek.com (web scraping)
- NASA JPL Horizons
- TimeAndDate.com
- Other astrology APIs

### test_verified_charts_batch2.js
Your existing batch test script for 10 verified charts including Obama.

## Obama's Birth Data (Reference)

**Birth Details:**
- Name: Barack Obama
- Date: August 4, 1961
- Time: 7:24 PM (19:24)
- Place: Honolulu, Hawaii, USA
- Coordinates: 21.3099°N, 157.8581°W
- Timezone: Pacific/Honolulu

**Expected Values (Sidereal/Lahiri):**
- Ascendant: ~18° Capricorn
- Moon: ~2-3° Taurus  
- Sun: ~12° Cancer

**Expected Values (Tropical):**
- Ascendant: ~18° Aquarius
- Moon: ~2-3° Gemini
- Sun: ~12° Leo

## Understanding the Results

### Swiss Ephemeris Test
This tests raw Swiss Ephemeris calculations with minimal wrapper code. If this shows different results than expected, the issue may be:
- Ephemeris data files
- Swiss Ephemeris configuration
- Timezone handling
- Ayanamsa settings

### Your Astrova Implementation Test
This calls your backend API. If this differs from Swiss Ephemeris, check:
- Your wrapper code around Swiss Ephemeris
- Date/time conversion logic
- Coordinate handling
- Response formatting

### Comparison Analysis
The scripts will highlight:
- Exact degree differences
- Sign differences (major issues)
- Ayanamsa accuracy
- Timezone conversion accuracy

## Common Issues and Solutions

### Backend Not Running
```
✗ Backend is not running
💡 Start your backend with: cd backend && npm start
```
**Solution:** Start your backend server first.

### Dependencies Missing
```
📦 Required dependencies missing. Please install:
npm install puppeteer cheerio
```
**Solution:** Run with `--full` flag to auto-install, or install manually.

### Swiss Ephemeris Errors
```
❌ Swiss Ephemeris data test failed
```
**Solution:** Check that ephemeris files are in `backend/ephemeris/` directory.

### API Connection Errors
```
❌ API test failed: connect ECONNREFUSED
```
**Solution:** Verify backend is running on correct port (3001).

## Interpreting Verification Results

### ✅ Perfect Match
Both implementations show identical results. Your implementation is accurate.

### ⚠️ Minor Differences (<1°)
Small variations in decimal precision. Usually acceptable for most applications.

### ❌ Sign Differences
Major issue - different zodiac signs indicate calculation problems requiring investigation.

### 🔍 Systematic Differences
If all planets show the same degree difference, likely an Ayanamsa or timezone issue.

## Troubleshooting Steps

1. **Run backend test first:**
   ```bash
   node run_verification.js --backend
   ```

2. **Check Swiss Ephemeris directly:**
   ```bash
   node backend/debug_swiss_ephemeris.js
   ```

3. **Run full verification:**
   ```bash
   node run_verification.js --full
   ```

4. **Compare with your existing batch test:**
   ```bash
   node test_verified_charts_batch2.js
   ```

## What Each Test Tells You

| Test | Purpose | What it Reveals |
|------|---------|----------------|
| Swiss Ephemeris Direct | Raw calculation accuracy | Basic astronomical calculations |
| Your API | Implementation accuracy | Your wrapper code and logic |
| Ayanamsa Comparison | Sidereal system accuracy | Correct Ayanamsa application |
| Timezone Test | Time conversion accuracy | UTC conversion and local time handling |
| Manual Calculations | Fundamental accuracy | Basic astronomical formulas |

## Next Steps After Verification

Based on the results:

1. **If Swiss Ephemeris differs from reference:** Check ephemeris files and configuration
2. **If your API differs from Swiss Ephemeris:** Debug your wrapper implementation
3. **If timezone issues detected:** Review date/time conversion logic
4. **If Ayanamsa issues detected:** Check Ayanamsa mode settings

## Support

If you need help interpreting the results or debugging issues found by the verification suite, the detailed output will guide you to the specific areas that need attention.

The verification suite is designed to be comprehensive but may not catch every edge case. Use it as a starting point for ensuring calculation accuracy in your astrology application.
