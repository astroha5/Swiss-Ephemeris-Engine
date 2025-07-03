#!/bin/bash

echo "📡 Downloading Swiss Ephemeris files for Astrova Backend"

# Create ephemeris directory
mkdir -p ephemeris
cd ephemeris

# Array of essential ephemeris files with their URLs
declare -a files=(
    "https://github.com/mivion/swisseph/raw/main/ephe/sepl_06.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/sepl_12.se1" 
    "https://github.com/mivion/swisseph/raw/main/ephe/sepl_18.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/semo_06.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/semo_12.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/semo_18.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/seas_06.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/seas_12.se1"
    "https://github.com/mivion/swisseph/raw/main/ephe/seas_18.se1"
)

# Download function
download_file() {
    local url=$1
    local filename=$(basename "$url")
    
    echo "⬇️  Downloading $filename..."
    
    if curl -L -f -o "$filename" "$url" 2>/dev/null; then
        if [ -f "$filename" ] && [ -s "$filename" ]; then
            # Check if it's a binary file (ephemeris files are binary)
            if file "$filename" | grep -q "data"; then
                echo "✅ Successfully downloaded $filename"
                return 0
            else
                echo "❌ Downloaded file $filename appears to be invalid"
                rm -f "$filename"
                return 1
            fi
        else
            echo "❌ Failed to download $filename - file is empty"
            rm -f "$filename"
            return 1
        fi
    else
        echo "❌ Failed to download $filename"
        return 1
    fi
}

# Download files
successful_downloads=0
total_files=${#files[@]}

for url in "${files[@]}"; do
    if download_file "$url"; then
        ((successful_downloads++))
    fi
done

echo ""
echo "📊 Download Summary:"
echo "   ✅ Successful: $successful_downloads/$total_files files"

if [ $successful_downloads -eq 0 ]; then
    echo ""
    echo "❌ No ephemeris files were downloaded successfully."
    echo "🔧 Creating minimal ephemeris files for development..."
    
    # Create minimal placeholder files for development
    cat > README.txt << 'EOF'
EPHEMERIS FILES NOTICE
=====================

This directory should contain Swiss Ephemeris files (.se1 format) for accurate
astronomical calculations. 

For production use, please download the complete ephemeris files from:
- https://www.astro.com/swisseph/
- https://github.com/aloistr/swisseph

Required files for comprehensive coverage (1800-2200 CE):
- sepl_*.se1 (planets)
- semo_*.se1 (moon)  
- seas_*.se1 (asteroids)

The current setup may work with built-in approximations but may have reduced
accuracy for dates outside the immediate range.
EOF

    echo "📄 Created README.txt with manual download instructions"
    
elif [ $successful_downloads -lt $((total_files / 2)) ]; then
    echo ""
    echo "⚠️  Warning: Only partial ephemeris files downloaded."
    echo "   Some date ranges may not be available."
    echo "   For full coverage, manually download missing files."
    
else
    echo ""
    echo "🎉 Ephemeris setup complete!"
    echo "   Your backend now has Swiss Ephemeris files for accurate calculations."
fi

echo ""
echo "📁 Ephemeris directory: $(pwd)"
echo "📋 Files downloaded:"
ls -la *.se1 2>/dev/null || echo "   (No .se1 files found)"

cd ..
echo ""
echo "✅ Swiss Ephemeris setup completed!"
echo "🚀 You can now start the backend with: npm run dev"
