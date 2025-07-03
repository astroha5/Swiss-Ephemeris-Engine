# Astrova Vedic Astrology Backend

This project is a high-accuracy Vedic astrology backend designed to calculate traditional astrological charts, Panchang details, and Vimshottari Dasha timelines.

## Features

- Accurate birth chart calculations based on Swiss Ephemeris.
- Traditional Panchang data, including tithi, nakshatra, yoga, and karana.
- Vimshottari Dasha calculations with detailed timelines.
- Modular structure with RESTful API endpoints for astrology calculations.

## Endpoints

1. **Birth Chart (`/api/kundli`)**: Generate detailed birth charts with planetary positions, houses, yogas, and doshas.
2. **Panchang (`/api/panchang`)**: Retrieve Panchang details for given date, time, and location.
3. **Dasha (`/api/dasha`)**: Calculate Vimshottari Dasha timeline for the provided birth details.

## Requirements

- **Node.js** >= 14.x
- **NPM** >= 6.x
- **Swiss Ephemeris Files**: Follow instructions to download the latest Swiss Ephemeris files to the `ephemeris` directory.

## Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/astrova-backend.git
   cd astrova-backend
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Configure the environment variables:
   ```sh
   cp .env.example .env
   # Then edit .env to include your configuration
   ```

4. Run the application:
   ```sh
   npm run dev
   ```

5. Visit `http://localhost:3001/api` to access the API.

## Note

- Ensure the `ephemeris` directory contains all necessary Swiss Ephemeris files.
- Follow best practices to secure the application before deploying it in production.
