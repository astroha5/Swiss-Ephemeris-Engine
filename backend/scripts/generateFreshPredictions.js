const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const MLAnalyticsService = require('../services/mlAnalyticsService');

/**
 * Generate fresh ML predictions using trained models
 */
async function generateFreshPredictions() {
  try {
    logger.info('🔮 Generating fresh ML predictions...');
    
    const mlService = new MLAnalyticsService();
    
    // Load the trained models
    await mlService.loadStoredModels();
    logger.info(`📚 Loaded ${mlService.trainedModels.size} trained models`);
    
    // Generate predictions for different time periods
    const predictionDates = [
      new Date(), // Current
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    ];
    
    const locations = [
      { name: 'Global', latitude: 0, longitude: 0 },
      { name: 'Washington DC', latitude: 38.9072, longitude: -77.0369 },
      { name: 'London', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Sydney', latitude: -33.8688, longitude: 151.2093 }
    ];
    
    const generatedPredictions = [];
    
    for (const location of locations) {
      for (const targetDate of predictionDates) {
        try {
          logger.info(`🎯 Generating prediction for ${location.name} on ${targetDate.toISOString().split('T')[0]}...`);
          
          // Generate risk assessment
          const riskAssessment = await mlService.predictCurrentRiskLevel(null, {
            location: location,
            date: targetDate
          });
          
          if (riskAssessment) {
            generatedPredictions.push(riskAssessment);
            logger.info(`✅ Generated ${riskAssessment.risk_level} risk prediction for ${location.name}: ${(riskAssessment.overall_risk_score * 100).toFixed(1)}%`);
            
            // Add small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          logger.error(`❌ Error generating prediction for ${location.name}:`, error.message);
        }
      }
    }
    
    logger.info(`🎉 Generated ${generatedPredictions.length} fresh ML predictions!`);
    
    // Verify recent predictions in database
    const { data: recentPredictions, error } = await supabase
      .from('ml_predictions')
      .select('prediction_date, risk_level, risk_score, location')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      logger.error('Error fetching recent predictions:', error.message);
    } else {
      logger.info('📊 Recent predictions in database:');
      recentPredictions.forEach(pred => {
        const locationName = pred.location?.name || 'Unknown';
        logger.info(`   - ${pred.prediction_date}: ${pred.risk_level} (${(pred.risk_score * 100).toFixed(1)}%) at ${locationName}`);
      });
    }
    
    return {
      success: true,
      predictions_generated: generatedPredictions.length,
      locations_processed: locations.length,
      dates_processed: predictionDates.length
    };
    
  } catch (error) {
    logger.error('💥 Error generating fresh predictions:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  generateFreshPredictions()
    .then(result => {
      console.log('🎉 Fresh ML Predictions Generated!');
      console.log(`- Predictions generated: ${result.predictions_generated}`);
      console.log(`- Locations processed: ${result.locations_processed}`);
      console.log(`- Time periods processed: ${result.dates_processed}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fresh prediction generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateFreshPredictions };
