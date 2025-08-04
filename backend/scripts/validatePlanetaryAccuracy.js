#!/usr/bin/env node

const { supabase } = require('../config/supabase');
const enhancedSwissEphemeris = require('../services/enhancedSwissEphemeris');
const { enrichWithAstroData } = require('../utils/enrichWithAstro');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * Comprehensive planetary accuracy validation script for 50 events database
 * Checks accuracy and suggests Swiss Ephemeris improvements
 */

class PlanetaryAccuracyValidator {
  constructor() {
    this.discrepancies = [];
    this.accuracyStats = {
      total_events: 0,
      events_with_coordinates: 0,
      events_with_transits: 0,
      accurate_positions: 0,
      minor_discrepancies: 0,
      major_discrepancies: 0,
      critical_errors: 0
    };
    
    // Tolerance levels for accuracy checking (in degrees)
    this.tolerances = {
      sun: 0.1,    // Sun should be very accurate
      moon: 0.5,   // Moon moves fast, small tolerance acceptable
      mercury: 0.2, // Fast moving inner planet
      venus: 0.2,   // Fast moving inner planet
      mars: 0.1,    // Mars should be accurate
      jupiter: 0.05, // Slow moving, should be very accurate
      saturn: 0.05,  // Slow moving, should be very accurate
      rahu: 0.2,    // Calculated node, small tolerance
      ketu: 0.2     // Calculated node, small tolerance
    };
  }

  /**
   * Main validation function
   */
  async validateDatabase() {
    try {
      console.log('🔍 PLANETARY ACCURACY VALIDATION STARTING...\n');
      console.log('=' .repeat(60));
      
      // Step 1: Check database connectivity and tables
      await this.checkDatabaseSetup();
      
      // Step 2: Get all events with their current astronomical data
      const events = await this.getAllEventsWithTransits();
      
      if (!events || events.length === 0) {
        console.log('❌ No events found in database for validation');
        return;
      }
      
      console.log(`📊 Found ${events.length} events to validate\n`);
      this.accuracyStats.total_events = events.length;
      
      // Step 3: Validate each event's planetary positions
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        console.log(`\n🔍 [${i + 1}/${events.length}] Validating: ${event.title}`);
        console.log(`📅 Date: ${event.event_date}`);
        console.log(`📍 Location: ${event.location_name || 'Unknown'}`);
        
        await this.validateEventPlanetaryPositions(event);
      }
      
      // Step 4: Generate comprehensive report
      await this.generateAccuracyReport();
      
      // Step 5: Recommend Swiss Ephemeris improvements
      await this.recommendImprovements();
      
      console.log('\n✅ VALIDATION COMPLETED');
      
    } catch (error) {
      logger.error('Validation failed:', error);
      console.error('❌ Validation failed:', error.message);
    }
  }

  /**
   * Check database setup and table availability
   */
  async checkDatabaseSetup() {
    console.log('🔧 Checking database setup...');
    
    const requiredTables = ['world_events', 'planetary_transits', 'planetary_aspects'];
    const tableStatus = {};
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        if (error) {
          tableStatus[table] = { exists: false, error: error.message };
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          tableStatus[table] = { exists: true, count: data?.length || 0 };
          console.log(`✅ ${table}: Available`);
        }
      } catch (err) {
        tableStatus[table] = { exists: false, error: err.message };
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Check Swiss Ephemeris availability
    console.log('\n🌟 Checking Swiss Ephemeris setup...');
    try {
      const testDate = new Date('2020-01-01');
      const testJD = enhancedSwissEphemeris.getJulianDay('2020-01-01', '12:00', 'UTC');
      const testPositions = enhancedSwissEphemeris.getPlanetaryPositions(testJD);
      console.log('✅ Swiss Ephemeris: Working properly');
      console.log(`📊 Test calculation: Sun at ${testPositions.planets.sun.longitude.toFixed(4)}°`);
    } catch (ephError) {
      console.log(`❌ Swiss Ephemeris: ${ephError.message}`);
      console.log('⚠️  This may affect calculation accuracy');
    }
    
    return tableStatus;
  }

  /**
   * Get all events with their current transit data
   */
  async getAllEventsWithTransits() {
    try {
      // First get all events
      const { data: events, error: eventsError } = await supabase
        .from('world_events')
        .select('*')
        .order('event_date', { ascending: true });
        
      if (eventsError) {
        throw eventsError;
      }
      
      if (!events || events.length === 0) {
        return [];
      }
      
      // Get planetary transits for these events
      const eventIds = events.map(e => e.id);
      const { data: transits, error: transitsError } = await supabase
        .from('planetary_transits')
        .select('*')
        .in('event_id', eventIds);
      
      if (transitsError) {
        console.log('⚠️  Could not fetch planetary transits:', transitsError.message);
      }
      
      // Combine events with their transit data
      const eventsWithTransits = events.map(event => {
        const eventTransits = transits ? transits.filter(t => t.event_id === event.id) : [];
        return {
          ...event,
          planetary_transits: eventTransits
        };
      });
      
      return eventsWithTransits;
      
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Validate planetary positions for a single event
   */
  async validateEventPlanetaryPositions(event) {
    try {
      // Skip if no coordinates
      if (!event.latitude || !event.longitude) {
        console.log('⚠️  No coordinates - skipping detailed validation');
        return;
      }
      
      this.accuracyStats.events_with_coordinates++;
      
      // Skip if no stored transit data
      if (!event.planetary_transits || event.planetary_transits.length === 0) {
        console.log('⚠️  No stored planetary transits found');
        
        // Try to generate fresh calculations for comparison
        await this.generateFreshCalculations(event);
        return;
      }
      
      this.accuracyStats.events_with_transits++;
      const storedTransit = event.planetary_transits[0];
      
      // Generate fresh calculations using current Swiss Ephemeris
      console.log('🔄 Recalculating planetary positions...');
      
      const eventDate = new Date(event.event_date);
      const eventTime = '12:00'; // Use noon if no specific time
      
      try {
        const freshData = await enrichWithAstroData(
          eventDate,
          parseFloat(event.latitude),
          parseFloat(event.longitude),
          event.location_name || 'Unknown',
          'UTC'
        );
        
        if (!freshData.success) {
          console.log(`❌ Failed to recalculate: ${freshData.error || 'Unknown error'}`);
          this.accuracyStats.critical_errors++;
          return;
        }
        
        // Compare stored vs fresh calculations
        console.log('📋 POSITION COMPARISON:');
        await this.comparePositions(storedTransit, freshData.astroSnapshot, event);
        
      } catch (calcError) {
        console.log(`❌ Calculation error: ${calcError.message}`);
        this.accuracyStats.critical_errors++;
        
        this.discrepancies.push({
          event_id: event.id,
          event_title: event.title,
          event_date: event.event_date,
          type: 'calculation_error',
          error: calcError.message,
          severity: 'critical'
        });
      }
      
    } catch (error) {
      logger.error(`Error validating event ${event.id}:`, error);
      this.accuracyStats.critical_errors++;
    }
  }

  /**
   * Generate fresh calculations for events without stored data
   */
  async generateFreshCalculations(event) {
    try {
      console.log('🆕 Generating fresh planetary calculations...');
      
      const eventDate = new Date(event.event_date);
      const eventTime = '12:00';
      
      const freshData = await enrichWithAstroData(
        eventDate,
        parseFloat(event.latitude),
        parseFloat(event.longitude),
        event.location_name || 'Unknown',
        'UTC'
      );
      
      if (freshData.success) {
        console.log('✅ Fresh calculations generated successfully');
        console.log(`☀️  Sun: ${freshData.astroSnapshot.sun.sign} ${freshData.astroSnapshot.sun.degreeFormatted}`);
        console.log(`🌙 Moon: ${freshData.astroSnapshot.moon.sign} ${freshData.astroSnapshot.moon.degreeFormatted}`);
        console.log(`🔴 Mars: ${freshData.astroSnapshot.mars.sign} ${freshData.astroSnapshot.mars.degreeFormatted}`);
        console.log(`🔵 Jupiter: ${freshData.astroSnapshot.jupiter.sign} ${freshData.astroSnapshot.jupiter.degreeFormatted}`);
        
        // Suggest storing this data
        this.discrepancies.push({
          event_id: event.id,
          event_title: event.title,
          event_date: event.event_date,
          type: 'missing_data',
          message: 'Event has coordinates but no stored planetary data',
          severity: 'medium',
          suggestion: 'Run data generation to populate planetary positions'
        });
        
      } else {
        console.log(`❌ Failed to generate fresh calculations: ${freshData.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Error generating fresh calculations: ${error.message}`);
    }
  }

  /**
   * Compare stored vs fresh planetary positions
   */
  async comparePositions(storedTransit, freshSnapshot, event) {
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];
    let hasDiscrepancies = false;
    let majorDiscrepancies = 0;
    let minorDiscrepancies = 0;
    
    for (const planet of planets) {
      const storedLon = storedTransit[`${planet}_longitude`];
      const freshLon = freshSnapshot[planet]?.longitude;
      const storedSign = storedTransit[`${planet}_sign`];
      const freshSign = freshSnapshot[planet]?.sign;
      
      if (storedLon !== null && freshLon !== null) {
        const diff = Math.abs(storedLon - freshLon);
        const tolerance = this.tolerances[planet] || 0.2;
        
        const status = diff <= tolerance ? '✅' : (diff <= tolerance * 3 ? '⚠️ ' : '❌');
        const severity = diff <= tolerance ? 'accurate' : (diff <= tolerance * 3 ? 'minor' : 'major');
        
        console.log(`${status} ${planet.toUpperCase()}: ${diff.toFixed(4)}° difference`);
        console.log(`   Stored: ${storedSign} ${storedLon.toFixed(4)}°`);
        console.log(`   Fresh:  ${freshSign} ${freshLon.toFixed(4)}°`);
        
        if (severity !== 'accurate') {
          hasDiscrepancies = true;
          
          if (severity === 'major') {
            majorDiscrepancies++;
          } else {
            minorDiscrepancies++;
          }
          
          this.discrepancies.push({
            event_id: event.id,
            event_title: event.title,
            event_date: event.event_date,
            planet: planet,
            type: 'position_discrepancy',
            stored_longitude: storedLon,
            fresh_longitude: freshLon,
            stored_sign: storedSign,
            fresh_sign: freshSign,
            difference_degrees: diff,
            tolerance: tolerance,
            severity: severity,
            within_tolerance: diff <= tolerance
          });
        }
      } else if (storedLon === null && freshLon !== null) {
        console.log(`⚠️  ${planet.toUpperCase()}: Missing stored data, fresh calculation available`);
      } else if (storedLon !== null && freshLon === null) {
        console.log(`⚠️  ${planet.toUpperCase()}: Stored data exists, fresh calculation failed`);
      }
    }
    
    // Update accuracy stats
    if (!hasDiscrepancies) {
      this.accuracyStats.accurate_positions++;
      console.log('🎯 Overall accuracy: EXCELLENT');
    } else if (majorDiscrepancies === 0) {
      this.accuracyStats.minor_discrepancies++;
      console.log('🟡 Overall accuracy: GOOD (minor discrepancies only)');
    } else {
      this.accuracyStats.major_discrepancies++;
      console.log('🔴 Overall accuracy: NEEDS ATTENTION (major discrepancies found)');
    }
  }

  /**
   * Generate comprehensive accuracy report
   */
  async generateAccuracyReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 COMPREHENSIVE ACCURACY REPORT');
    console.log('=' .repeat(60));
    
    const stats = this.accuracyStats;
    const totalValidated = stats.events_with_transits;
    
    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total Events: ${stats.total_events}`);
    console.log(`   Events with Coordinates: ${stats.events_with_coordinates}`);
    console.log(`   Events with Stored Transits: ${stats.events_with_transits}`);
    console.log(`   Accurate Positions: ${stats.accurate_positions} (${((stats.accurate_positions/totalValidated)*100).toFixed(1)}%)`);
    console.log(`   Minor Discrepancies: ${stats.minor_discrepancies} (${((stats.minor_discrepancies/totalValidated)*100).toFixed(1)}%)`);
    console.log(`   Major Discrepancies: ${stats.major_discrepancies} (${((stats.major_discrepancies/totalValidated)*100).toFixed(1)}%)`);
    console.log(`   Critical Errors: ${stats.critical_errors}`);
    
    // Accuracy grade
    const accuracyPercentage = (stats.accurate_positions / totalValidated) * 100;
    let grade, recommendation;
    
    if (accuracyPercentage >= 90) {
      grade = 'A+ (EXCELLENT)';
      recommendation = 'Your planetary calculations are highly accurate. Consider minor ephemeris updates for perfectionism.';
    } else if (accuracyPercentage >= 80) {
      grade = 'A (VERY GOOD)';
      recommendation = 'Good accuracy. Consider downloading additional Swiss Ephemeris files for better precision.';
    } else if (accuracyPercentage >= 70) {
      grade = 'B (GOOD)';
      recommendation = 'Acceptable accuracy. Upgrade Swiss Ephemeris files and check calculation methods.';
    } else if (accuracyPercentage >= 60) {
      grade = 'C (FAIR)';
      recommendation = 'Below optimal accuracy. Swiss Ephemeris upgrade strongly recommended.';
    } else {
      grade = 'D (POOR)';
      recommendation = 'Critical accuracy issues. Immediate Swiss Ephemeris overhaul required.';
    }
    
    console.log(`\n🎯 ACCURACY GRADE: ${grade}`);
    console.log(`💡 RECOMMENDATION: ${recommendation}`);
    
    // Detailed discrepancy analysis
    if (this.discrepancies.length > 0) {
      console.log(`\n⚠️  DETAILED DISCREPANCY ANALYSIS:`);
      
      const discrepanciesByPlanet = {};
      const discrepanciesBySeverity = { major: 0, minor: 0, critical: 0 };
      
      this.discrepancies.forEach(disc => {
        if (disc.planet) {
          if (!discrepanciesByPlanet[disc.planet]) {
            discrepanciesByPlanet[disc.planet] = [];
          }
          discrepanciesByPlanet[disc.planet].push(disc);
        }
        
        if (disc.severity) {
          discrepanciesBySeverity[disc.severity]++;
        }
      });
      
      console.log(`\n   Discrepancies by Planet:`);
      Object.entries(discrepanciesByPlanet).forEach(([planet, discs]) => {
        const avgDiff = discs.reduce((sum, d) => sum + (d.difference_degrees || 0), 0) / discs.length;
        console.log(`     ${planet.toUpperCase()}: ${discs.length} issues, avg ${avgDiff.toFixed(4)}° difference`);
      });
      
      console.log(`\n   Most Problematic Events:`);
      const eventDiscrepancies = {};
      this.discrepancies.forEach(disc => {
        if (!eventDiscrepancies[disc.event_id]) {
          eventDiscrepancies[disc.event_id] = {
            title: disc.event_title,
            date: disc.event_date,
            issues: []
          };
        }
        eventDiscrepancies[disc.event_id].issues.push(disc);
      });
      
      const sortedEvents = Object.values(eventDiscrepancies)
        .sort((a, b) => b.issues.length - a.issues.length)
        .slice(0, 5);
        
      sortedEvents.forEach((event, i) => {
        console.log(`     ${i+1}. ${event.title} (${event.date}): ${event.issues.length} issues`);
      });
    }
  }

  /**
   * Recommend Swiss Ephemeris improvements
   */
  async recommendImprovements() {
    console.log('\n' + '=' .repeat(60));
    console.log('🚀 SWISS EPHEMERIS IMPROVEMENT RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    // Check current ephemeris files
    const { execSync } = require('child_process');
    const fs = require('fs');
    const ephemerisPath = '/Users/richardbelll/Astrova/backend/ephemeris/';
    
    console.log('\n📁 Current Ephemeris Files:');
    try {
      const files = fs.readdirSync(ephemerisPath);
      const seFiles = files.filter(f => f.endsWith('.se1'));
      
      if (seFiles.length === 0) {
        console.log('❌ No Swiss Ephemeris .se1 files found!');
        console.log('🔧 CRITICAL: Download complete ephemeris files immediately');
      } else {
        seFiles.forEach(file => {
          const stats = fs.statSync(`${ephemerisPath}${file}`);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`   ✅ ${file} (${sizeMB} MB)`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not read ephemeris directory: ${error.message}`);
    }
    
    // Recommendations based on accuracy results
    console.log('\n💡 SPECIFIC RECOMMENDATIONS:');
    
    const accuracyPercentage = (this.accuracyStats.accurate_positions / this.accuracyStats.events_with_transits) * 100;
    
    if (accuracyPercentage < 80) {
      console.log('1. 🔄 UPGRADE SWISS EPHEMERIS FILES:');
      console.log('   - Download latest DE440/DE441 ephemeris files');
      console.log('   - Get complete coverage for 1800-2200 CE');
      console.log('   - Run: bash download-ephemeris.sh');
      console.log('');
    }
    
    console.log('2. 📥 RECOMMENDED EPHEMERIS FILES:');
    console.log('   Core Files (Essential):');
    console.log('   - sepl_*.se1 (Main planets)');
    console.log('   - semo_*.se1 (Moon positions)');
    console.log('   - seas_*.se1 (Asteroid positions)');
    console.log('');
    console.log('   Extended Coverage:');
    console.log('   - sepl_06.se1, sepl_12.se1, sepl_18.se1 (1800-2200)');
    console.log('   - semo_06.se1, semo_12.se1, semo_18.se1 (Moon 1800-2200)');
    console.log('');
    
    console.log('3. 🔧 CONFIGURATION IMPROVEMENTS:');
    console.log('   - Ensure Lahiri Ayanamsa is properly set');
    console.log('   - Verify timezone handling for historical events');
    console.log('   - Consider implementing delta T corrections');
    console.log('');
    
    console.log('4. 📊 DATA QUALITY IMPROVEMENTS:');
    console.log('   - Recalculate events with major discrepancies');
    console.log('   - Store calculation metadata (ephemeris version, etc.)');
    console.log('   - Implement periodic validation checks');
    console.log('');
    
    // Generate download script
    this.generateEphemerisDownloadScript();
    
    console.log('5. 🚀 NEXT STEPS:');
    console.log('   a) Run the ephemeris download script');
    console.log('   b) Recalculate problematic events');
    console.log('   c) Re-run this validation script');
    console.log('   d) Monitor ongoing accuracy');
  }

  /**
   * Generate download script for better ephemeris files
   */
  generateEphemerisDownloadScript() {
    const script = `#!/bin/bash
# Enhanced Swiss Ephemeris Download Script
# Generated by Planetary Accuracy Validator

echo "🌟 Downloading Enhanced Swiss Ephemeris Files..."

cd "/Users/richardbelll/Astrova/backend/ephemeris/"

# Essential files for high accuracy (1800-2200 CE)
declare -a files=(
    "https://www.astro.com/ftp/swisseph/ephe/sepl_06.se1"
    "https://www.astro.com/ftp/swisseph/ephe/sepl_12.se1"
    "https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1"
    "https://www.astro.com/ftp/swisseph/ephe/semo_06.se1"
    "https://www.astro.com/ftp/swisseph/ephe/semo_12.se1"
    "https://www.astro.com/ftp/swisseph/ephe/semo_18.se1"
    "https://www.astro.com/ftp/swisseph/ephe/seas_06.se1"
    "https://www.astro.com/ftp/swisseph/ephe/seas_12.se1"
    "https://www.astro.com/ftp/swisseph/ephe/seas_18.se1"
)

for url in "\${files[@]}"; do
    filename=\$(basename "\$url")
    echo "⬇️  Downloading \$filename..."
    curl -L -o "\$filename" "\$url"
    if [ $? -eq 0 ]; then
        echo "✅ \$filename downloaded successfully"
    else
        echo "❌ Failed to download \$filename"
    fi
done

echo "🎉 Enhanced ephemeris download completed!"
`;

    const fs = require('fs');
    const scriptPath = '/Users/richardbelll/Astrova/backend/scripts/download-enhanced-ephemeris.sh';
    
    try {
      fs.writeFileSync(scriptPath, script);
      fs.chmodSync(scriptPath, '755');
      console.log(`📝 Generated enhanced download script: ${scriptPath}`);
      console.log('   Run with: bash scripts/download-enhanced-ephemeris.sh');
    } catch (error) {
      console.log(`❌ Could not create download script: ${error.message}`);
    }
  }
}

// Run the validation if called directly
if (require.main === module) {
  const validator = new PlanetaryAccuracyValidator();
  validator.validateDatabase()
    .then(() => {
      console.log('\n🎉 Validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = PlanetaryAccuracyValidator;
