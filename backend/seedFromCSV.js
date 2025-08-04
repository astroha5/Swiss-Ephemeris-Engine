import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import logger from './utils/logger.js';
import worldEventsService from './services/worldEventsService.js';

// Use worldEventsService as eventService for compatibility
const eventService = worldEventsService;

// CSV file path - modify this if your CSV is in a different location
const CSV_FILE_PATH = path.join(process.cwd(), 'data', 'eventsToSeed.csv');

// Valid enum values based on your database schema
const VALID_CATEGORIES = ['financial', 'natural_disaster', 'political', 'war', 'technology', 'social', 'pandemic', 'terrorism', 'accident', 'other'];
const VALID_EVENT_TYPES = ['election', 'referendum', 'coup', 'war', 'peace_treaty', 'market_crash', 'economic_boom', 'recession', 'earthquake', 'hurricane', 'tsunami', 'wildfire', 'terrorist_attack', 'bombing', 'invention', 'discovery', 'product_launch', 'protest', 'revolution', 'celebration', 'festival', 'battle', 'invasion', 'space_mission', 'pandemic', 'outbreak', 'disease_outbreak', 'stock_crash'];
const VALID_IMPACT_LEVELS = ['low', 'medium', 'high', 'extreme'];

function validateEventData(event, rowIndex) {
  const errors = [];
  
  // Required fields
  if (!event.title) errors.push(`Row ${rowIndex}: Missing title`);
  if (!event.description) errors.push(`Row ${rowIndex}: Missing description`);
  if (!event.event_date) errors.push(`Row ${rowIndex}: Missing event_date`);
  if (!event.category) errors.push(`Row ${rowIndex}: Missing category`);
  if (!event.event_type) errors.push(`Row ${rowIndex}: Missing event_type`);
  if (!event.impact_level) errors.push(`Row ${rowIndex}: Missing impact_level`);
  if (!event.location_name) errors.push(`Row ${rowIndex}: Missing location_name`);
  
  // Validate enums
  if (event.category && !VALID_CATEGORIES.includes(event.category)) {
    errors.push(`Row ${rowIndex}: Invalid category '${event.category}'. Valid options: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (event.event_type && !VALID_EVENT_TYPES.includes(event.event_type)) {
    errors.push(`Row ${rowIndex}: Invalid event_type '${event.event_type}'. Valid options: ${VALID_EVENT_TYPES.join(', ')}`);
  }
  if (event.impact_level && !VALID_IMPACT_LEVELS.includes(event.impact_level)) {
    errors.push(`Row ${rowIndex}: Invalid impact_level '${event.impact_level}'. Valid options: ${VALID_IMPACT_LEVELS.join(', ')}`);
  }
  
  // Validate date format
  if (event.event_date) {
    const date = new Date(event.event_date);
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowIndex}: Invalid date format '${event.event_date}'. Use ISO 8601 format (e.g., 2001-09-11T08:46:00Z)`);
    }
  }
  
  // Validate coordinates
  if (event.latitude !== undefined && event.latitude !== '') {
    const lat = parseFloat(event.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push(`Row ${rowIndex}: Invalid latitude '${event.latitude}'. Must be between -90 and 90`);
    }
  }
  if (event.longitude !== undefined && event.longitude !== '') {
    const lng = parseFloat(event.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push(`Row ${rowIndex}: Invalid longitude '${event.longitude}'. Must be between -180 and 180`);
    }
  }
  
  return errors;
}

function transformCSVEvent(csvRow) {
  return {
    title: csvRow.title?.trim(),
    description: csvRow.description?.trim(),
    event_date: csvRow.event_date?.trim(),
    category: csvRow.category?.trim(),
    event_type: csvRow.event_type?.trim(),
    impact_level: csvRow.impact_level?.trim(),
    location_name: csvRow.location_name?.trim(),
    latitude: csvRow.latitude ? parseFloat(csvRow.latitude) : undefined,
    longitude: csvRow.longitude ? parseFloat(csvRow.longitude) : undefined,
    country_code: csvRow.country_code?.trim(),
    affected_population: csvRow.affected_population ? parseInt(csvRow.affected_population) : undefined,
    source_url: csvRow.source_url?.trim(),
    source_name: csvRow.source_name?.trim()
  };
}

async function seedEventsFromCSV() {
  try {
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      logger.error(`CSV file not found at: ${CSV_FILE_PATH}`);
      logger.info('Please create the CSV file with your events data.');
      return;
    }

    logger.info(`Reading CSV file from: ${CSV_FILE_PATH}`);
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    logger.info(`Found ${records.length} events in CSV file`);

    if (records.length === 0) {
      logger.warn('No events found in CSV file');
      return;
    }

    // Transform and validate events
    const events = [];
    const validationErrors = [];

    for (let i = 0; i < records.length; i++) {
      const csvRow = records[i];
      const event = transformCSVEvent(csvRow);
      const errors = validateEventData(event, i + 2); // +2 because CSV has header row and is 1-indexed
      
      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        events.push(event);
      }
    }

    // Report validation errors
    if (validationErrors.length > 0) {
      logger.error('Validation errors found:');
      validationErrors.forEach(error => logger.error(error));
      logger.error(`Found ${validationErrors.length} validation errors. Please fix these before seeding.`);
      return;
    }

    logger.info(`All ${events.length} events passed validation`);

    // Process events in batches
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      batches.push(events.slice(i, i + BATCH_SIZE));
    }

    logger.info(`Processing ${events.length} events in ${batches.length} batches of ${BATCH_SIZE}`);

    let successCount = 0;
    let failureCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      logger.info(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} events)`);

      for (const event of batch) {
        try {
          logger.info(`Creating event: ${event.title}`);
          const result = await eventService.createEvent(event);
          logger.info(`✓ Successfully created event: ${event.title} (ID: ${result.id})`);
          successCount++;
        } catch (error) {
          logger.error(`✗ Failed to create event: ${event.title}`);
          logger.error(`Error: ${error.message}`);
          failureCount++;
        }
      }

      // Small delay between batches to avoid overwhelming the system
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final summary
    logger.info('\n' + '='.repeat(50));
    logger.info('CSV SEEDING COMPLETED');
    logger.info('='.repeat(50));
    logger.info(`Total events processed: ${events.length}`);
    logger.info(`Successful: ${successCount}`);
    logger.info(`Failed: ${failureCount}`);
    
    if (failureCount === 0) {
      logger.info('🎉 All events were seeded successfully!');
    } else {
      logger.warn(`⚠️  ${failureCount} events failed to seed. Check the logs above for details.`);
    }

  } catch (error) {
    logger.error('Error reading or parsing CSV file:', error);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const isTestMode = args.includes('--test');
const customPath = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

if (customPath) {
  CSV_FILE_PATH = path.resolve(customPath);
}

if (isTestMode) {
  logger.info('Running in TEST MODE - will only validate CSV structure');
  // Test mode: just validate the CSV without actually seeding
  seedEventsFromCSV().then(() => {
    logger.info('Test completed. Use `node seedFromCSV.js` to actually seed the events.');
  });
} else {
  seedEventsFromCSV().then(() => {
    process.exit(0);
  }).catch(error => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
}
