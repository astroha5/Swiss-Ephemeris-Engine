const worldEventsService = require('../services/worldEventsService');
const logger = require('../utils/logger');

/**
 * Additional Historical Events Data for Seeding
 * These are major world events with their astrological significance
 */
const additionalEvents = [
  {
    title: "September 11 Attacks (9/11)",
    description: "Coordinated terror attacks on the US by al-Qaeda, killing ~3,000 people. Changed global security policies forever.",
    event_date: "2001-09-11T08:46:00Z", // First plane hit time
    category: "terrorism",
    event_type: "terrorist_attack",
    impact_level: "extreme",
    location_name: "New York City",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 2977,
    source_url: "https://en.wikipedia.org/wiki/September_11_attacks",
    source_name: "wikipedia"
  },
  {
    title: "COVID-19 Pandemic Declared",
    description: "WHO officially declared COVID-19 a global pandemic, marking the start of worldwide lockdowns and unprecedented global health crisis.",
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
    source_name: "wikipedia"
  },
  {
    title: "2020 Global Stock Market Crash",
    description: "Markets crashed due to COVID-19 panic and lockdowns. Dow Jones fell over 2,000 points in a single day.",
    event_date: "2020-03-12T00:00:00Z",
    category: "financial",
    event_type: "market_crash",
    impact_level: "extreme",
    location_name: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country_code: "US",
    affected_population: 500000000,
    source_url: "https://en.wikipedia.org/wiki/2020_stock_market_crash",
    source_name: "wikipedia"
  },
  {
    title: "2008 Financial Crisis (Lehman Collapse)",
    description: "Lehman Brothers declared bankruptcy, triggering global recession and the worst financial crisis since the Great Depression.",
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
    source_name: "wikipedia"
  },
  {
    title: "Indian Ocean Tsunami",
    description: "A massive 9.1-magnitude earthquake caused a tsunami that killed over 230,000 people across 14 countries.",
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
    source_name: "wikipedia"
  },
  {
    title: "Fukushima Nuclear Disaster",
    description: "Earthquake and tsunami led to nuclear plant meltdown in Japan, causing long-term radiation concerns.",
    event_date: "2011-03-11T14:46:00Z",
    category: "accident",
    event_type: "nuclear_accident",
    impact_level: "extreme",
    location_name: "Fukushima, Japan",
    latitude: 37.4214,
    longitude: 141.0328,
    country_code: "JP",
    affected_population: 154000,
    source_url: "https://en.wikipedia.org/wiki/Fukushima_nuclear_disaster",
    source_name: "wikipedia"
  },
  {
    title: "Russia Invades Ukraine",
    description: "Start of Russia's full-scale military invasion of Ukraine, escalating the ongoing conflict since 2014.",
    event_date: "2022-02-24T05:00:00Z",
    category: "war",
    event_type: "invasion",
    impact_level: "extreme",
    location_name: "Kiev, Ukraine",
    latitude: 50.4501,
    longitude: 30.5234,
    country_code: "UA",
    affected_population: 44000000,
    source_url: "https://en.wikipedia.org/wiki/2022_Russian_invasion_of_Ukraine",
    source_name: "wikipedia"
  },
  {
    title: "Brexit Referendum",
    description: "UK votes to leave the EU, causing global economic and political shifts. 51.9% voted to leave.",
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
    source_name: "wikipedia"
  },
  {
    title: "Fall of Berlin Wall",
    description: "Marked the beginning of the end of the Cold War and reunification of Germany. Symbol of freedom and unity.",
    event_date: "1989-11-09T18:00:00Z",
    category: "political",
    event_type: "regime_change",
    impact_level: "extreme",
    location_name: "Berlin",
    latitude: 52.5200,
    longitude: 13.4050,
    country_code: "DE",
    affected_population: 16000000,
    source_url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall",
    source_name: "wikipedia"
  },
  {
    title: "Challenger Space Shuttle Explosion",
    description: "NASA shuttle Challenger exploded 73 seconds after launch, killing all 7 crew members including teacher Christa McAuliffe.",
    event_date: "1986-01-28T16:39:00Z",
    category: "accident",
    event_type: "space_accident",
    impact_level: "high",
    location_name: "Cape Canaveral, Florida",
    latitude: 28.3922,
    longitude: -80.6077,
    country_code: "US",
    affected_population: 7,
    source_url: "https://en.wikipedia.org/wiki/Space_Shuttle_Challenger_disaster",
    source_name: "wikipedia"
  },
  {
    title: "Apollo 11 Moon Landing",
    description: "First successful manned moon landing by NASA. Neil Armstrong becomes the first human to walk on the Moon.",
    event_date: "1969-07-20T20:17:00Z",
    category: "technology",
    event_type: "space_mission",
    impact_level: "high",
    location_name: "Moon (launched from Cape Kennedy)",
    latitude: 28.3922,
    longitude: -80.6077,
    country_code: "US",
    affected_population: 3000000000, // Estimated global viewership
    source_url: "https://en.wikipedia.org/wiki/Apollo_11",
    source_name: "wikipedia"
  },
  {
    title: "India's Emergency Declaration",
    description: "Indian PM Indira Gandhi declared emergency rule, suspending civil liberties and democratic processes for 21 months.",
    event_date: "1975-06-25T00:00:00Z",
    category: "political",
    event_type: "emergency_declaration",
    impact_level: "high",
    location_name: "New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    country_code: "IN",
    affected_population: 620000000,
    source_url: "https://en.wikipedia.org/wiki/The_Emergency_(India)",
    source_name: "wikipedia"
  },
  {
    title: "9.0 Japan Earthquake (Tohoku)",
    description: "One of the strongest earthquakes in history, triggering a tsunami and the Fukushima nuclear disaster.",
    event_date: "2011-03-11T14:46:23Z",
    category: "natural_disaster",
    event_type: "earthquake_tsunami",
    impact_level: "extreme",
    location_name: "Tohoku, Japan",
    latitude: 38.3220,
    longitude: 142.3690,
    country_code: "JP",
    affected_population: 15900,
    source_url: "https://en.wikipedia.org/wiki/2011_T%C5%8Dhoku_earthquake_and_tsunami",
    source_name: "wikipedia"
  },
  {
    title: "Arab Spring Begins",
    description: "Protests began in Tunisia after Mohamed Bouazizi's self-immolation, sparking revolutions across the Arab world.",
    event_date: "2010-12-17T00:00:00Z",
    category: "social",
    event_type: "revolution",
    impact_level: "extreme",
    location_name: "Tunis, Tunisia",
    latitude: 36.8065,
    longitude: 10.1815,
    country_code: "TN",
    affected_population: 350000000,
    source_url: "https://en.wikipedia.org/wiki/Arab_Spring",
    source_name: "wikipedia"
  },
  {
    title: "Demonetization in India",
    description: "Indian PM Modi announced sudden demonetization of ₹500 and ₹1000 notes, affecting 86% of currency in circulation.",
    event_date: "2016-11-08T20:00:00Z",
    category: "financial",
    event_type: "currency_reform",
    impact_level: "high",
    location_name: "New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    country_code: "IN",
    affected_population: 1300000000,
    source_url: "https://en.wikipedia.org/wiki/2016_Indian_banknote_demonetisation",
    source_name: "wikipedia"
  },
  {
    title: "George Floyd Protests",
    description: "Death of George Floyd in police custody triggered global protests against police brutality and systemic racism.",
    event_date: "2020-05-25T20:08:00Z",
    category: "social",
    event_type: "protests",
    impact_level: "high",
    location_name: "Minneapolis",
    latitude: 44.9778,
    longitude: -93.2650,
    country_code: "US",
    affected_population: 25000000,
    source_url: "https://en.wikipedia.org/wiki/George_Floyd_protests",
    source_name: "wikipedia"
  },
  {
    title: "Sri Lankan Easter Bombings",
    description: "Coordinated bombings in churches and hotels on Easter Sunday killed over 250 people and injured 500+.",
    event_date: "2019-04-21T08:45:00Z",
    category: "terrorism",
    event_type: "terrorist_attack",
    impact_level: "high",
    location_name: "Colombo",
    latitude: 6.9271,
    longitude: 79.8612,
    country_code: "LK",
    affected_population: 279,
    source_url: "https://en.wikipedia.org/wiki/2019_Sri_Lanka_Easter_bombings",
    source_name: "wikipedia"
  },
  {
    title: "Haiti Earthquake",
    description: "A devastating 7.0 magnitude earthquake struck Haiti, killing over 200,000 people and leaving 1.5 million homeless.",
    event_date: "2010-01-12T21:53:10Z",
    category: "natural_disaster",
    event_type: "earthquake",
    impact_level: "extreme",
    location_name: "Port-au-Prince",
    latitude: 18.5944,
    longitude: -72.3074,
    country_code: "HT",
    affected_population: 316000,
    source_url: "https://en.wikipedia.org/wiki/2010_Haiti_earthquake",
    source_name: "wikipedia"
  },
  {
    title: "World War II Begins",
    description: "Germany invaded Poland, marking the start of WWII. Britain and France declared war on Germany two days later.",
    event_date: "1939-09-01T04:45:00Z",
    category: "war",
    event_type: "invasion",
    impact_level: "extreme",
    location_name: "Warsaw, Poland",
    latitude: 52.2297,
    longitude: 21.0122,
    country_code: "PL",
    affected_population: 70000000, // Total WWII casualties
    source_url: "https://en.wikipedia.org/wiki/World_War_II",
    source_name: "wikipedia"
  },
  {
    title: "World Trade Organization Formed",
    description: "Formation of WTO, reshaping global trade agreements and replacing GATT. Established multilateral trading system.",
    event_date: "1995-01-01T00:00:00Z",
    category: "political",
    event_type: "international_organization",
    impact_level: "high",
    location_name: "Geneva",
    latitude: 46.2044,
    longitude: 6.1432,
    country_code: "CH",
    affected_population: 5000000000, // Global trade impact
    source_url: "https://en.wikipedia.org/wiki/World_Trade_Organization",
    source_name: "wikipedia"
  },
  {
    title: "Chernobyl Nuclear Disaster",
    description: "Catastrophic reactor explosion, worst nuclear disaster in history.",
    event_date: "1986-04-26T00:00:00Z",
    category: "accident",
    event_type: "nuclear_accident",
    impact_level: "extreme",
    location_name: "Pripyat, Ukraine (USSR)",
    latitude: 51.389,
    longitude: 30.099,
    country_code: "UA",
    affected_population: 335000,
    source_url: "https://en.wikipedia.org/wiki/Chernobyl_disaster",
    source_name: "wikipedia"
  },
  {
    title: "Tiananmen Square Massacre",
    description: "Chinese military crackdown on pro-democracy protestors; thousands killed.",
    event_date: "1989-06-04T00:00:00Z",
    category: "political",
    event_type: "protest_crackdown",
    impact_level: "extreme",
    location_name: "Beijing, China",
    latitude: 39.9042,
    longitude: 116.4074,
    country_code: "CN",
    affected_population: 10000,
    source_url: "https://en.wikipedia.org/wiki/Tiananmen_Square_protests",
    source_name: "wikipedia"
  },
  {
    title: "Bitcoin Genesis Block",
    description: "First Bitcoin block mined; beginning of decentralized cryptocurrencies.",
    event_date: "2009-01-03T00:00:00Z",
    category: "technology",
    event_type: "tech_milestone",
    impact_level: "medium",
    location_name: "Online/Global",
    latitude: 0.0,
    longitude: 0.0,
    country_code: "GL",
    affected_population: 7000000,
    source_url: "https://en.wikipedia.org/wiki/Bitcoin",
    source_name: "wikipedia"
  },
  {
    title: "Paris Climate Agreement Signed",
    description: "Historic international agreement to combat climate change.",
    event_date: "2015-12-12T00:00:00Z",
    category: "political",
    event_type: "global_accord",
    impact_level: "high",
    location_name: "Paris, France",
    latitude: 48.8566,
    longitude: 2.3522,
    country_code: "FR",
    affected_population: 7800000000,
    source_url: "https://en.wikipedia.org/wiki/Paris_Agreement",
    source_name: "wikipedia"
  },
  {
    title: "Indian Independence",
    description: "India gained independence from British rule.",
    event_date: "1947-08-15T00:00:00Z",
    category: "political",
    event_type: "sovereignty",
    impact_level: "high",
    location_name: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    country_code: "IN",
    affected_population: 380000000,
    source_url: "https://en.wikipedia.org/wiki/Indian_independence",
    source_name: "wikipedia"
  },
  {
    title: "Facebook Launches",
    description: "Launch of Facebook; beginning of the social media era.",
    event_date: "2004-02-04T00:00:00Z",
    category: "technology",
    event_type: "tech_launch",
    impact_level: "high",
    location_name: "Harvard, USA",
    latitude: 42.3770,
    longitude: -71.1167,
    country_code: "US",
    affected_population: 2900000,
    source_url: "https://en.wikipedia.org/wiki/Facebook",
    source_name: "wikipedia"
  },
  {
    title: "COVID-19 Vaccine Rollout Begins",
    description: "First approved COVID-19 vaccine (Pfizer) given to the public.",
    event_date: "2020-12-08T00:00:00Z",
    category: "pandemic",
    event_type: "medical_breakthrough",
    impact_level: "extreme",
    location_name: "United Kingdom",
    latitude: 55.3781,
    longitude: -3.4360,
    country_code: "GB",
    affected_population: 67000000,
    source_url: "https://en.wikipedia.org/wiki/COVID-19_vaccine",
    source_name: "wikipedia"
  },
  {
    title: "Black Monday",
    description: "Global stock markets crashed in a single day, worst % drop in Dow history.",
    event_date: "1987-10-19T00:00:00Z",
    category: "financial",
    event_type: "stock_market_crash",
    impact_level: "extreme",
    location_name: "Global",
    latitude: 0.0,
    longitude: 0.0,
    country_code: "GL",
    affected_population: 40000000,
    source_url: "https://en.wikipedia.org/wiki/Black_Monday",
    source_name: "wikipedia"
  },
  {
    title: "Death of Queen Elizabeth II",
    description: "UK’s longest-reigning monarch died after 70 years on the throne.",
    event_date: "2022-09-08T00:00:00Z",
    category: "political",
    event_type: "national_mourning",
    impact_level: "high",
    location_name: "Balmoral, Scotland",
    latitude: 57.0385,
    longitude: -3.2305,
    country_code: "GB",
    affected_population: 67000000,
    source_url: "https://en.wikipedia.org/wiki/Death_of_Queen_Elizabeth_II",
    source_name: "wikipedia"
  },
  {
    title: "Indian Moon Landing (Chandrayaan-3)",
    description: "India became the first country to land near the lunar south pole.",
    event_date: "2023-08-23T00:00:00Z",
    category: "technology",
    event_type: "space_mission",
    impact_level: "high",
    location_name: "South Pole, Moon",
    latitude: -90.0,
    longitude: 0.0,
    country_code: "IN",
    affected_population: 0,
    source_url: "https://en.wikipedia.org/wiki/Chandrayaan-3",
    source_name: "wikipedia"
  },
  {
    title: "Iran Revolution Begins",
    description: "Shah of Iran overthrown, Islamic Republic founded.",
    event_date: "1979-01-16T00:00:00Z",
    category: "political",
    event_type: "revolution",
    impact_level: "extreme",
    location_name: "Tehran, Iran",
    latitude: 35.6892,
    longitude: 51.3890,
    country_code: "IR",
    affected_population: 37000000,
    source_url: "https://en.wikipedia.org/wiki/Iranian_Revolution",
    source_name: "wikipedia"
  },
  {
    title: "Hurricane Katrina",
    description: "One of the deadliest hurricanes in US history; 1,800+ killed.",
    event_date: "2005-08-29T00:00:00Z",
    category: "natural_disaster",
    event_type: "natural_disaster",
    impact_level: "extreme",
    location_name: "New Orleans, USA",
    latitude: 29.9511,
    longitude: -90.0715,
    country_code: "US",
    affected_population: 1800,
    source_url: "https://en.wikipedia.org/wiki/Hurricane_Katrina",
    source_name: "wikipedia"
  },
  {
    title: "The Great Depression Begins",
    description: "Stock market crash led to decade-long global depression.",
    event_date: "1929-10-29T00:00:00Z",
    category: "financial",
    event_type: "economic_collapse",
    impact_level: "extreme",
    location_name: "USA",
    latitude: 37.0902,
    longitude: -95.7129,
    country_code: "US",
    affected_population: 200000000,
    source_url: "https://en.wikipedia.org/wiki/Great_Depression",
    source_name: "wikipedia"
  },
  {
    title: "Launch of iPhone",
    description: "Apple released the iPhone, transforming mobile communication.",
    event_date: "2007-06-29T00:00:00Z",
    category: "technology",
    event_type: "tech_product_launch",
    impact_level: "high",
    location_name: "USA",
    latitude: 37.7749,
    longitude: -122.4194,
    country_code: "US",
    affected_population: 1000000,
    source_url: "https://en.wikipedia.org/wiki/IPhone",
    source_name: "wikipedia"
  },
  {
    title: "Sri Lankan Civil War Ends",
    description: "End of 26-year civil war after defeat of Tamil Tigers.",
    event_date: "2009-05-18T00:00:00Z",
    category: "war",
    event_type: "war_ends",
    impact_level: "high",
    location_name: "Sri Lanka",
    latitude: 7.8731,
    longitude: 80.7718,
    country_code: "LK",
    affected_population: 25000000,
    source_url: "https://en.wikipedia.org/wiki/Sri_Lankan_Civil_War",
    source_name: "wikipedia"
  },
  {
    title: "Amazon Rainforest Fires Peak",
    description: "Record-breaking wildfires spark global climate concern.",
    event_date: "2019-08-19T00:00:00Z",
    category: "natural_disaster",
    event_type: "environmental_crisis",
    impact_level: "high",
    location_name: "Brazil",
    latitude: -3.4653,
    longitude: -62.2159,
    country_code: "BR",
    affected_population: 225000,
    source_url: "https://en.wikipedia.org/wiki/2019_Amazon_forest_wildfires",
    source_name: "wikipedia"
  },
  {
    title: "Nelson Mandela Released",
    description: "Mandela released after 27 years in prison, ending apartheid era.",
    event_date: "1990-02-11T00:00:00Z",
    category: "social",
    event_type: "political_event",
    impact_level: "extreme",
    location_name: "Cape Town, South Africa",
    latitude: -33.9249,
    longitude: 18.4241,
    country_code: "ZA",
    affected_population: 30000000,
    source_url: "https://en.wikipedia.org/wiki/Nelson_Mandela",
    source_name: "wikipedia"
  },
  {
    title: "Berlin Airlift Begins",
    description: "US/UK launched massive airlift during Soviet blockade of West Berlin.",
    event_date: "1948-06-24T00:00:00Z",
    category: "Political/Military",
    event_type: "cold_war_conflict",
    impact_level: "high",
    location_name: "Berlin, Germany",
    latitude: 52.5200,
    longitude: 13.4050,
    country_code: "DE",
    affected_population: 2200000,
    source_url: "https://en.wikipedia.org/wiki/Berlin_Blockade",
    source_name: "wikipedia"
  },
  {
    title: "Israel Declares Independence",
    description: "Birth of modern Israel, leading to regional conflict.",
    event_date: "1948-05-14T00:00:00Z",
    category: "Political",
    event_type: "state_formation",
    impact_level: "extreme",
    location_name: "Tel Aviv, Israel",
    latitude: 32.0853,
    longitude: 34.7818,
    country_code: "IL",
    affected_population: 800000,
    source_url: "https://en.wikipedia.org/wiki/Israeli_Declaration_of_Independence",
    source_name: "wikipedia"
  },
  {
    title: "Roe v. Wade Overturned",
    description: "US Supreme Court overturned abortion rights ruling after 49 years.",
    event_date: "2022-06-24T00:00:00Z",
    category: "Political/Social",
    event_type: "legal_reversal",
    impact_level: "high",
    location_name: "USA",
    latitude: 38.9072,
    longitude: -77.0369,
    country_code: "US",
    affected_population: 328200000,
    source_url: "https://en.wikipedia.org/wiki/Dobbs_v._Jackson_Women%27s_Health_Organization",
    source_name: "wikipedia"
  }
];
/**
 * Seed the database with additional historical events
 */
async function seedAdditionalEvents() {
  try {
    logger.info('🌱 Starting to seed additional historical events...');
    logger.info(`📊 Found ${additionalEvents.length} additional events to seed`);

    const results = {
      created: [],
      failed: [],
      total: additionalEvents.length
    };

    // Process events in smaller batches to avoid overwhelming Swiss Ephemeris calculations
    const batchSize = 2;
    for (let i = 0; i < additionalEvents.length; i += batchSize) {
      const batch = additionalEvents.slice(i, i + batchSize);
      
      logger.info(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(additionalEvents.length / batchSize)}`);

      const batchPromises = batch.map(async (eventData, index) => {
        try {
          logger.info(`⚙️  Creating event: ${eventData.title}`);
          logger.info(`📅 Event date: ${eventData.event_date}`);
          logger.info(`📍 Location: ${eventData.location_name} (${eventData.latitude}, ${eventData.longitude})`);
          
          const result = await worldEventsService.createEvent(eventData);
          results.created.push(result);
          
          logger.info(`✅ Created: ${eventData.title} (ID: ${result.id})`);
          logger.info(`🔭 Planetary transits calculated and stored`);
          
          // Delay to avoid overwhelming Swiss Ephemeris
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
      if (i + batchSize < additionalEvents.length) {
        logger.info('⏳ Waiting between batches for Swiss Ephemeris...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    logger.info('🎉 Additional historical events seeding completed!');
    logger.info(`📈 Results: ${results.created.length} created, ${results.failed.length} failed`);

    if (results.failed.length > 0) {
      logger.error('❌ Failed events:');
      results.failed.forEach(failure => {
        logger.error(`   - ${failure.event.title}: ${failure.error}`);
      });
    }

    // Log some statistics
    const categories = {};
    results.created.forEach(event => {
      categories[event.category] = (categories[event.category] || 0) + 1;
    });
    
    logger.info('📊 Events created by category:');
    Object.entries(categories).forEach(([category, count]) => {
      logger.info(`   - ${category}: ${count} events`);
    });

    return results;

  } catch (error) {
    logger.error('💥 Additional historical events seeding failed:', error.message);
    throw error;
  }
}

/**
 * Seed a smaller set of test events for development
 */
async function seedTestAdditionalEvents() {
  try {
    logger.info('🧪 Seeding test additional events...');

    const testEvents = additionalEvents.slice(0, 3); // Just first 3 events
    
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
        
        // Small delay between test events
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`❌ Failed to create test event "${eventData.title}": ${error.message}`);
        results.failed.push({
          event: eventData,
          error: error.message
        });
      }
    }

    logger.info('🧪 Test additional events seeding completed!');
    logger.info(`📈 Results: ${results.created.length} created, ${results.failed.length} failed`);

    return results;

  } catch (error) {
    logger.error('💥 Test additional events seeding failed:', error.message);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const mode = process.argv[2] || 'full';
  
  if (mode === 'test') {
    seedTestAdditionalEvents()
      .then((results) => {
        logger.info('🎉 Test additional seeding process finished');
        console.log('Results:', JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Test additional seeding process failed:', error.message);
        process.exit(1);
      });
  } else {
    seedAdditionalEvents()
      .then((results) => {
        logger.info('🎉 Full additional seeding process finished');
        console.log('Results:', JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Full additional seeding process failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = {
  seedAdditionalEvents,
  seedTestAdditionalEvents,
  additionalEvents
};
