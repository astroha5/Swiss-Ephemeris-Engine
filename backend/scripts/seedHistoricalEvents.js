const worldEventsService = require('../services/worldEventsService');
const logger = require('../utils/logger');

/**
 * Historical Events Data for Seeding
 * These are major world events with their astrological significance
 */
const historicalEvents = [
  // Financial Crisis Events
  {
    title: "2008 Financial Crisis Peak",
    description: "Lehman Brothers collapse triggering global financial crisis. Stock markets crashed worldwide, leading to the Great Recession.",
    event_date: "2008-09-15T00:00:00Z",
    category: "financial",
    event_type: "market_crash",
    impact_level: "extreme",
    location_name: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 300000000,
    source_url: "https://en.wikipedia.org/wiki/2008_financial_crisis",
    source_name: "historical"
  },
  {
    title: "Black Monday Stock Market Crash",
    description: "Dow Jones Industrial Average fell 22.6% in a single day, the largest one-day percentage decline in history.",
    event_date: "1987-10-19T00:00:00Z",
    category: "financial",
    event_type: "market_crash",
    impact_level: "extreme",
    location_name: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 250000000,
    source_url: "https://en.wikipedia.org/wiki/Black_Monday_(1987)",
    source_name: "historical"
  },
  {
    title: "Dot-com Bubble Burst",
    description: "NASDAQ composite index peaked and began a two-year decline, wiping out $5 trillion in market value.",
    event_date: "2000-03-10T00:00:00Z",
    category: "financial",
    event_type: "market_crash",
    impact_level: "high",
    location_name: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 280000000,
    source_url: "https://en.wikipedia.org/wiki/Dot-com_bubble",
    source_name: "historical"
  },

  // Natural Disasters
  {
    title: "2004 Indian Ocean Tsunami",
    description: "Devastating tsunami affecting multiple countries around the Indian Ocean, triggered by a 9.1-9.3 magnitude earthquake.",
    event_date: "2004-12-26T00:58:53Z",
    category: "natural_disaster",
    event_type: "tsunami",
    impact_level: "extreme",
    location_name: "Indian Ocean",
    latitude: 3.3190,
    longitude: 95.8540,
    country_code: "ID",
    affected_population: 230000,
    source_url: "https://en.wikipedia.org/wiki/2004_Indian_Ocean_earthquake_and_tsunami",
    source_name: "historical"
  },
  {
    title: "Hurricane Katrina",
    description: "Devastating Category 5 hurricane that caused catastrophic damage along the Gulf coast, particularly in New Orleans.",
    event_date: "2005-08-29T00:00:00Z",
    category: "natural_disaster",
    event_type: "hurricane",
    impact_level: "extreme",
    location_name: "New Orleans",
    latitude: 29.9511,
    longitude: -90.0715,
    country_code: "US",
    affected_population: 1200000,
    source_url: "https://en.wikipedia.org/wiki/Hurricane_Katrina",
    source_name: "historical"
  },
  {
    title: "2011 Tōhoku Earthquake and Tsunami",
    description: "9.1 magnitude earthquake off the coast of Japan, triggering tsunami waves and the Fukushima nuclear disaster.",
    event_date: "2011-03-11T14:46:23Z",
    category: "natural_disaster",
    event_type: "earthquake_tsunami",
    impact_level: "extreme",
    location_name: "Tōhoku, Japan",
    latitude: 38.3220,
    longitude: 142.3690,
    country_code: "JP",
    affected_population: 15900,
    source_url: "https://en.wikipedia.org/wiki/2011_T%C5%8Dhoku_earthquake_and_tsunami",
    source_name: "historical"
  },

  // Terrorist Attacks
  {
    title: "9/11 World Trade Center Attack",
    description: "Terrorist attacks on World Trade Center and Pentagon, marking a turning point in global security and politics.",
    event_date: "2001-09-11T08:46:00Z",
    category: "terrorism",
    event_type: "terrorist_attack",
    impact_level: "extreme",
    location_name: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 2977,
    source_url: "https://en.wikipedia.org/wiki/September_11_attacks",
    source_name: "historical"
  },
  {
    title: "London 7/7 Bombings",
    description: "Coordinated terrorist attacks on London's public transport system during the morning rush hour.",
    event_date: "2005-07-07T08:50:00Z",
    category: "terrorism",
    event_type: "terrorist_attack",
    impact_level: "high",
    location_name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    country_code: "GB",
    affected_population: 56,
    source_url: "https://en.wikipedia.org/wiki/7_July_2005_London_bombings",
    source_name: "historical"
  },

  // Political Events
  {
    title: "Brexit Referendum",
    description: "United Kingdom votes to leave the European Union in a historic referendum.",
    event_date: "2016-06-23T00:00:00Z",
    category: "political",
    event_type: "referendum",
    impact_level: "high",
    location_name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    country_code: "GB",
    affected_population: 65000000,
    source_url: "https://en.wikipedia.org/wiki/2016_United_Kingdom_European_Union_membership_referendum",
    source_name: "historical"
  },
  {
    title: "Fall of Berlin Wall",
    description: "The symbolic end of the Cold War as East and West Germans tear down the Berlin Wall.",
    event_date: "1989-11-09T00:00:00Z",
    category: "political",
    event_type: "regime_change",
    impact_level: "extreme",
    location_name: "Berlin",
    latitude: 52.5200,
    longitude: 13.4050,
    country_code: "DE",
    affected_population: 16000000,
    source_url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall",
    source_name: "historical"
  },
  {
    title: "2016 US Presidential Election",
    description: "Donald Trump wins the US Presidential Election, defeating Hillary Clinton in a surprising upset.",
    event_date: "2016-11-08T00:00:00Z",
    category: "political",
    event_type: "election",
    impact_level: "high",
    location_name: "Washington DC",
    latitude: 38.9072,
    longitude: -77.0369,
    country_code: "US",
    affected_population: 323000000,
    source_url: "https://en.wikipedia.org/wiki/2016_United_States_presidential_election",
    source_name: "historical"
  },

  // Pandemic Events
  {
    title: "COVID-19 Pandemic Declaration",
    description: "WHO declares COVID-19 a global pandemic, marking the beginning of worldwide lockdowns and economic disruption.",
    event_date: "2020-03-11T00:00:00Z",
    category: "pandemic",
    event_type: "disease_outbreak",
    impact_level: "extreme",
    location_name: "Geneva",
    latitude: 46.2044,
    longitude: 6.1432,
    country_code: "CH",
    affected_population: 7800000000,
    source_url: "https://en.wikipedia.org/wiki/COVID-19_pandemic",
    source_name: "historical"
  },
  {
    title: "COVID-19 First Lockdown",
    description: "Italy becomes the first Western country to implement a nationwide lockdown due to COVID-19.",
    event_date: "2020-03-09T00:00:00Z",
    category: "pandemic",
    event_type: "lockdown",
    impact_level: "extreme",
    location_name: "Rome",
    latitude: 41.9028,
    longitude: 12.4964,
    country_code: "IT",
    affected_population: 60000000,
    source_url: "https://en.wikipedia.org/wiki/COVID-19_pandemic_in_Italy",
    source_name: "historical"
  },

  // Wars and Conflicts
  {
    title: "Iraq War Begins",
    description: "US-led coalition invades Iraq, beginning the Iraq War that would last for years.",
    event_date: "2003-03-20T00:00:00Z",
    category: "war",
    event_type: "invasion",
    impact_level: "extreme",
    location_name: "Baghdad",
    latitude: 33.3152,
    longitude: 44.3661,
    country_code: "IQ",
    affected_population: 25000000,
    source_url: "https://en.wikipedia.org/wiki/Iraq_War",
    source_name: "historical"
  },
  {
    title: "Russia Invades Ukraine",
    description: "Russia launches a full-scale invasion of Ukraine, escalating the conflict that began in 2014.",
    event_date: "2022-02-24T00:00:00Z",
    category: "war",
    event_type: "invasion",
    impact_level: "extreme",
    location_name: "Kiev",
    latitude: 50.4501,
    longitude: 30.5234,
    country_code: "UA",
    affected_population: 44000000,
    source_url: "https://en.wikipedia.org/wiki/2022_Russian_invasion_of_Ukraine",
    source_name: "historical"
  },

  // Technology Events
  {
    title: "iPhone Launch",
    description: "Apple launches the first iPhone, revolutionizing the smartphone industry and mobile technology.",
    event_date: "2007-01-09T00:00:00Z",
    category: "technology",
    event_type: "product_launch",
    impact_level: "high",
    location_name: "San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
    country_code: "US",
    affected_population: 1000000000,
    source_url: "https://en.wikipedia.org/wiki/IPhone_(1st_generation)",
    source_name: "historical"
  },
  {
    title: "Facebook IPO",
    description: "Facebook goes public with the largest technology IPO in history at the time.",
    event_date: "2012-05-18T00:00:00Z",
    category: "technology",
    event_type: "ipo",
    impact_level: "medium",
    location_name: "Menlo Park",
    latitude: 37.4845,
    longitude: -122.1477,
    country_code: "US",
    affected_population: 900000000,
    source_url: "https://en.wikipedia.org/wiki/Facebook_IPO",
    source_name: "historical"
  },

  // Social Events
  {
    title: "Arab Spring Begins",
    description: "Tunisian Revolution begins, sparking the Arab Spring movement across the Middle East and North Africa.",
    event_date: "2010-12-17T00:00:00Z",
    category: "social",
    event_type: "revolution",
    impact_level: "extreme",
    location_name: "Tunis",
    latitude: 36.8065,
    longitude: 10.1815,
    country_code: "TN",
    affected_population: 350000000,
    source_url: "https://en.wikipedia.org/wiki/Arab_Spring",
    source_name: "historical"
  },
  {
    title: "George Floyd Protests Begin",
    description: "Widespread protests begin across the United States following the death of George Floyd, sparking a global movement.",
    event_date: "2020-05-25T00:00:00Z",
    category: "social",
    event_type: "protests",
    impact_level: "high",
    location_name: "Minneapolis",
    latitude: 44.9778,
    longitude: -93.2650,
    country_code: "US",
    affected_population: 25000000,
    source_url: "https://en.wikipedia.org/wiki/George_Floyd_protests",
    source_name: "historical"
  }
];

/**
 * Seed the database with historical events
 */
async function seedHistoricalEvents() {
  try {
    logger.info('🌱 Starting to seed historical events...');
    logger.info(`📊 Found ${historicalEvents.length} events to seed`);

    const results = {
      created: [],
      failed: [],
      total: historicalEvents.length
    };

    // Process events in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < historicalEvents.length; i += batchSize) {
      const batch = historicalEvents.slice(i, i + batchSize);
      
      logger.info(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(historicalEvents.length / batchSize)}`);

      const batchPromises = batch.map(async (eventData, index) => {
        try {
          logger.info(`⚙️  Creating event: ${eventData.title}`);
          
          const result = await worldEventsService.createEvent(eventData);
          results.created.push(result);
          
          logger.info(`✅ Created: ${eventData.title} (ID: ${result.id})`);
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          logger.error(`❌ Failed to create event "${eventData.title}": ${error.message}`);
          results.failed.push({
            event: eventData,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Longer delay between batches
      if (i + batchSize < historicalEvents.length) {
        logger.info('⏳ Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    logger.info('🎉 Historical events seeding completed!');
    logger.info(`📈 Results: ${results.created.length} created, ${results.failed.length} failed`);

    if (results.failed.length > 0) {
      logger.error('❌ Failed events:');
      results.failed.forEach(failure => {
        logger.error(`   - ${failure.event.title}: ${failure.error}`);
      });
    }

    return results;

  } catch (error) {
    logger.error('💥 Historical events seeding failed:', error.message);
    throw error;
  }
}

/**
 * Seed a smaller set of test events for development
 */
async function seedTestEvents() {
  try {
    logger.info('🧪 Seeding test events...');

    const testEvents = historicalEvents.slice(0, 5); // Just first 5 events
    
    const results = {
      created: [],
      failed: [],
      total: testEvents.length
    };

    for (const eventData of testEvents) {
      try {
        logger.info(`⚙️  Creating test event: ${eventData.title}`);
        const result = await worldEventsService.createEvent(eventData);
        results.created.push(result);
        logger.info(`✅ Created test event: ${eventData.title}`);
      } catch (error) {
        logger.error(`❌ Failed to create test event "${eventData.title}": ${error.message}`);
        results.failed.push({
          event: eventData,
          error: error.message
        });
      }
    }

    logger.info('🧪 Test events seeding completed!');
    logger.info(`📈 Results: ${results.created.length} created, ${results.failed.length} failed`);

    return results;

  } catch (error) {
    logger.error('💥 Test events seeding failed:', error.message);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const mode = process.argv[2] || 'full';
  
  if (mode === 'test') {
    seedTestEvents()
      .then((results) => {
        logger.info('🎉 Test seeding process finished');
        console.log('Results:', JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Test seeding process failed:', error.message);
        process.exit(1);
      });
  } else {
    seedHistoricalEvents()
      .then((results) => {
        logger.info('🎉 Full seeding process finished');
        console.log('Results:', JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Full seeding process failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = {
  seedHistoricalEvents,
  seedTestEvents,
  historicalEvents
};
