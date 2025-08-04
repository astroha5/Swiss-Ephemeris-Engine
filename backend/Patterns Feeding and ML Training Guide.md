# Astrova Vedic Astrology Backend

This project is a high-accuracy Vedic astrology backend designed to calculate traditional astrological charts, Panchang details, and Vimshottari Dasha timelines.

# Astrological Patterns Feeding and ML Training Guide

This guide will help you feed the `astrological_patterns` table using data from the `world_events` table and train Machine Learning models to predict astrological successes.

## Prerequisites

1. **Node.js & npm** - to manage server-side operations.
2. **Python 3.x** - for running ML training scripts.
3. **PostgreSQL** - as the database system.
4. **Python Packages** - TensorFlow, scikit-learn, numpy, pandas, joblib.
5. Ensure the server is running and accessible at `localhost:3001`.

## Step 1: Start the Server

Ensure your backend server is running. Your server should include the necessary APIs to fetch pattern data and perform analysis.

```bash
nohup node server.js > server.log 2>&1 &
```

## Step 2: Feed the `astrological_patterns` Table

1. **Run Pattern Analysis:**
   Use the provided API to analyze patterns from the `world_events` table.

   ```bash
   curl -X POST http://localhost:3001/api/planetary-events/patterns/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "category": "all",
       "limit": 100
     }'
   ```

2. **Verify Patterns:**
   Check whether `astrological_patterns` table is populated.

   ```bash
   curl -X GET http://localhost:3001/api/planetary-events/patterns/stats
   ```

## Step 3: Train ML Models

1. **Prepare Environment:**
   Ensure Python environment is set up with required packages.

   ```bash
   pip3 install tensorflow scikit-learn numpy pandas joblib
   ```

2. **Train ML Models:**
   Run ML training scripts provided in the backend directory.

   ```bash
   python3 ml_train_enhanced.py
   ```

   This script fetches data from the server, processes it, trains the model, and saves it as `.pkl` files.

3. **Verify Saved Models:**
   Confirm the models are saved successfully.

   ```bash
   ls -la *.pkl
   ```

## Note

- The scripts are configured to fetch top astrological patterns for training.
- Adjust server endpoints, database queries, or ML parameters as per your project's need.

## Troubleshooting

- Ensure all services are running and accessible.
- Check server logs (`server.log`) for errors during pattern analysis.
- Verify Python dependencies are installed correctly.

## Conclusion

By following this guide, you should successfully feed the `astrological_patterns` table and train ML models. Adapt the steps as necessary to fit your specific project architecture.

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
