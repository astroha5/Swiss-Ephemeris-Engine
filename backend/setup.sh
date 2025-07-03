#!/bin/bash

echo "🚀 Setting up Astrova Vedic Astrology Backend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please review and update it if needed."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create ephemeris directory
if [ ! -d "ephemeris" ]; then
    echo "📁 Creating ephemeris directory..."
    mkdir ephemeris
    echo "📋 Please download Swiss Ephemeris files to the 'ephemeris' directory:"
    echo "   - Visit: https://www.astro.com/swisseph/swephinfo_e.htm"
    echo "   - Download ephemeris files for your date range"
    echo "   - Extract to ./ephemeris/ directory"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "   npm run dev"
echo ""
echo "To start the production server:"
echo "   npm start"
echo ""
echo "📡 Server will run on: http://localhost:3001"
echo "📚 API documentation: http://localhost:3001/"
echo "🏥 Health check: http://localhost:3001/health"
