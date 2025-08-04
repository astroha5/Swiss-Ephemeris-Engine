const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Insert sample ML models and data directly to test the system
 */
async function insertSampleMLData() {
  try {
    logger.info('📊 Inserting sample ML data using direct insertions...');

    // First, let's check if the astrological_patterns table exists
    // and insert our ML patterns there for now
    const samplePatterns = [
      {
        pattern_name: 'ml_pattern_financial_crisis',
        description: 'ML-identified pattern for financial crisis events based on Saturn-Pluto aspects and Mars positions',
        pattern_type: 'ml_category_pattern',
        pattern_conditions: {
          category: 'financial',
          planetary_signatures: {
            saturn: { most_common_signs: [{ pattern: 'Capricorn', frequency: 12, significance: 0.85 }] },
            mars: { most_common_signs: [{ pattern: 'Capricorn', frequency: 8, significance: 0.72 }] },
            jupiter: { most_common_signs: [{ pattern: 'Sagittarius', frequency: 6, significance: 0.68 }] }
          },
          aspect_signatures: {
            most_common_aspects: [
              { pattern: 'saturn-pluto-conjunction', frequency: 5, significance: 0.92 },
              { pattern: 'mars-saturn-square', frequency: 7, significance: 0.78 }
            ]
          },
          accuracy: 0.78,
          training_size: 150
        },
        total_occurrences: 15,
        success_rate: 78,
        category: 'financial'
      },
      {
        pattern_name: 'ml_pattern_political_events',
        description: 'ML-identified pattern for political events based on Mars-Saturn aspects and Sun positions',
        pattern_type: 'ml_category_pattern',
        pattern_conditions: {
          category: 'political',
          planetary_signatures: {
            mars: { most_common_signs: [{ pattern: 'Aries', frequency: 9, significance: 0.82 }] },
            saturn: { most_common_signs: [{ pattern: 'Aquarius', frequency: 7, significance: 0.74 }] },
            sun: { most_common_signs: [{ pattern: 'Leo', frequency: 5, significance: 0.66 }] }
          },
          aspect_signatures: {
            most_common_aspects: [
              { pattern: 'mars-saturn-conjunction', frequency: 6, significance: 0.88 },
              { pattern: 'sun-pluto-square', frequency: 4, significance: 0.71 }
            ]
          },
          accuracy: 0.71,
          training_size: 89
        },
        total_occurrences: 12,
        success_rate: 71,
        category: 'political'
      },
      {
        pattern_name: 'ml_pattern_natural_disasters',
        description: 'ML-identified pattern for natural disaster events based on Mars-Uranus aspects',
        pattern_type: 'ml_category_pattern',
        pattern_conditions: {
          category: 'natural_disaster',
          planetary_signatures: {
            mars: { most_common_signs: [{ pattern: 'Scorpio', frequency: 8, significance: 0.79 }] },
            uranus: { most_common_signs: [{ pattern: 'Taurus', frequency: 6, significance: 0.73 }] },
            saturn: { most_common_signs: [{ pattern: 'Pisces', frequency: 4, significance: 0.67 }] }
          },
          aspect_signatures: {
            most_common_aspects: [
              { pattern: 'mars-uranus-conjunction', frequency: 7, significance: 0.85 },
              { pattern: 'saturn-uranus-square', frequency: 5, significance: 0.76 }
            ]
          },
          accuracy: 0.69,
          training_size: 67
        },
        total_occurrences: 10,
        success_rate: 69,
        category: 'natural_disaster'
      },
      {
        pattern_name: 'ml_pattern_pandemic_health',
        description: 'ML-identified pattern for pandemic and health crisis events',
        pattern_type: 'ml_category_pattern',
        pattern_conditions: {
          category: 'pandemic',
          planetary_signatures: {
            saturn: { most_common_signs: [{ pattern: 'Capricorn', frequency: 4, significance: 0.91 }] },
            neptune: { most_common_signs: [{ pattern: 'Pisces', frequency: 3, significance: 0.87 }] },
            mars: { most_common_signs: [{ pattern: 'Virgo', frequency: 2, significance: 0.83 }] }
          },
          aspect_signatures: {
            most_common_aspects: [
              { pattern: 'saturn-pluto-conjunction', frequency: 3, significance: 0.94 },
              { pattern: 'jupiter-pluto-conjunction', frequency: 2, significance: 0.89 }
            ]
          },
          accuracy: 0.84,
          training_size: 25
        },
        total_occurrences: 5,
        success_rate: 84,
        category: 'pandemic'
      }
    ];

    // Insert patterns
    for (const pattern of samplePatterns) {
      try {
        const { data, error } = await supabase
          .from('astrological_patterns')
          .upsert(pattern, { onConflict: 'pattern_name' });
        
        if (error) {
          logger.warn(`Warning inserting pattern ${pattern.pattern_name}:`, error.message);
        } else {
          logger.info(`✅ Inserted ML pattern: ${pattern.pattern_name}`);
        }
      } catch (error) {
        logger.warn(`Could not insert pattern ${pattern.pattern_name}:`, error.message);
      }
    }

    logger.info('📊 Sample ML patterns inserted successfully!');

    // Now let's also add some sample notifications to test the notification system
    const sampleNotifications = [
      {
        type: 'pattern_match',
        title: 'High-Risk Financial Pattern Detected',
        message: 'ML analysis indicates a 78% match with historical financial crisis patterns. Saturn-Pluto conjunction active with Mars in Capricorn.',
        risk_level: 'HIGH',
        target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        details: {
          pattern_matches: [
            { pattern_name: 'ml_pattern_financial_crisis', match_strength: 78, confidence: 0.85 }
          ],
          planetary_config: {
            saturn: { sign: 'Capricorn', degree: 15.2 },
            mars: { sign: 'Capricorn', degree: 27.8 },
            jupiter: { sign: 'Sagittarius', degree: 22.1 }
          }
        },
        is_read: false
      },
      {
        type: 'high_risk_period',
        title: 'Moderate Risk Period - Political Events',
        message: 'ML models suggest increased probability of political events based on Mars-Saturn aspects. Confidence: 71%',
        risk_level: 'MEDIUM',
        target_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        details: {
          pattern_matches: [
            { pattern_name: 'ml_pattern_political_events', match_strength: 65, confidence: 0.71 }
          ],
          categories_affected: ['political', 'social']
        },
        is_read: false
      }
    ];

    // Insert notifications
    for (const notification of sampleNotifications) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification);
        
        if (error) {
          logger.warn('Warning inserting notification:', error.message);
        } else {
          logger.info('✅ Inserted sample notification');
        }
      } catch (error) {
        logger.warn('Could not insert notification:', error.message);
      }
    }

    logger.info('🎉 Sample ML data insertion completed successfully!');
    return true;

  } catch (error) {
    logger.error('❌ Error inserting sample ML data:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  insertSampleMLData()
    .then(() => {
      logger.info('🎉 Sample ML data insertion finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      logger.error('💥 Sample data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertSampleMLData };
