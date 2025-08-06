/**
 * Setup and Generate Event-level Predictions
 * - Detect world_events.id type
 * - Ensure ml_predictions has event_id column and unique constraint per (event_id, model_name)
 * - Generate predictions only for "complete" events and upsert into ml_predictions
 *
 * Requirements:
 * - backend/config/supabase.js configured (service role preferred for DDL; anon may fail on DDL)
 * - Backend server should be running for pattern stats if used (optional)
 *
 * Usage:
 *   node backend/scripts/setupAndGeneratePredictions.js
 */

const { supabase, sql } = require('../config/supabase');
const logger = require('../utils/logger');

async function detectWorldEventsIdType() {
  try {
    const { data, error } = await supabase.from('world_events').select('id').limit(5);
    if (error) {
      logger.warn('Failed to sample world_events.id:', error.message);
      return 'unknown';
    }
    const ids = (data || []).map((r) => r.id);
    const looksUuid = ids.some(
      (v) => typeof v === 'string' && /^[0-9a-fA-F-]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)
    );
    const looksNumber = ids.some((v) => typeof v === 'number');
    if (looksUuid) return 'uuid';
    if (looksNumber) return 'bigint';
    return 'unknown';
  } catch (e) {
    logger.warn('Error detecting world_events.id type:', e.message);
    return 'unknown';
  }
}

async function runDDL(queries) {
  // Prefer direct postgres connection if available (service role). Otherwise attempt supabase.rpc('exec_sql') fallback.
  let used = 'none';
  for (const q of queries) {
    try {
      if (sql) {
        await sql.unsafe(q);
        used = 'direct_pg';
      } else {
        // Try RPC if available. Your environment may have a Postgres function exec_sql(query text).
        const { error } = await supabase.rpc('exec_sql', { query: q });
        if (error) {
          logger.warn('RPC exec_sql failed:', error.message);
          used = 'rpc_failed';
        } else {
          used = 'rpc';
        }
      }
      logger.info(`Executed DDL: ${q.replace(/\s+/g, ' ').trim().slice(0, 160)}...`);
    } catch (e) {
      logger.warn('DDL execution error (continuing):', e.message);
    }
  }
  return used;
}

async function ensureMlPredictionsSchema() {
  // Add event_id and constrain uniqueness with model_name for event-level predictions
  const idType = await detectWorldEventsIdType();
  const columnType = idType === 'uuid' ? 'uuid' : idType === 'bigint' ? 'bigint' : 'bigint';

  const ddls = [
    `ALTER TABLE IF NOT EXISTS ml_predictions ADD COLUMN IF NOT EXISTS event_id ${columnType};`,
    // Add an index for lookups by event
    `CREATE INDEX IF NOT EXISTS idx_ml_predictions_event ON ml_predictions(event_id);`,
    // Create functional unique index using model_name inside JSON model_info if "model_name" column not present
    // Prefer direct model_name column if you have it; fall back to JSON extraction
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_indexes WHERE indexname = 'ux_ml_predictions_event_model'
       ) THEN
         BEGIN
           -- Try unique on (event_id, model_name) if column exists
           PERFORM 1 FROM information_schema.columns
           WHERE table_name='ml_predictions' AND column_name='model_name';
           IF FOUND THEN
             EXECUTE 'CREATE UNIQUE INDEX ux_ml_predictions_event_model ON ml_predictions(event_id, model_name) WHERE event_id IS NOT NULL';
           ELSE
             -- Fall back to JSON model_info->>model_name
             EXECUTE 'CREATE UNIQUE INDEX ux_ml_predictions_event_model ON ml_predictions(event_id, ((model_info->>''model_name''))) WHERE event_id IS NOT NULL';
           END IF;
         EXCEPTION WHEN others THEN
           -- Ignore if cannot create; continue
           NULL;
         END;
       END IF;
     END $$;`,
  ];

  const method = await runDDL(ddls);
  logger.info(`DDL executed via: ${method}`);
  return columnType;
}

function isCompleteEvent(e) {
  // Required: event_date (datetime), latitude, longitude, planetary_snapshot, planetary_aspects
  // Optional: location_name/country_code
  const hasDate = !!e.event_date;
  const hasLatLon = typeof e.latitude === 'number' && typeof e.longitude === 'number';
  const hasSnapshot = !!e.planetary_snapshot;
  const hasAspects = !!e.planetary_aspects;
  return hasDate && hasLatLon && hasSnapshot && hasAspects;
}

function featureFromEvent(e) {
  // Very simple feature extraction using available fields
  const aspectsCount = Array.isArray(e.planetary_aspects) ? e.planetary_aspects.length : 0;
  const hasRahuKetu =
    JSON.stringify(e.planetary_snapshot || {}).toLowerCase().includes('rahu') ||
    JSON.stringify(e.planetary_snapshot || {}).toLowerCase().includes('ketu');

  return {
    aspectsCount,
    hasRahuKetu: hasRahuKetu ? 1 : 0,
    latAbs: Math.abs(e.latitude || 0),
    lonAbs: Math.abs(e.longitude || 0),
  };
}

// Simple risk scoring heuristic if Python model invocation is skipped.
// You can replace this with a call to ml_predict.py using child_process with arguments/features.
function scoreRisk(feat) {
  const base = 0.2 + 0.03 * feat.aspectsCount + 0.1 * feat.hasRahuKetu + 0.01 * (feat.latAbs + feat.lonAbs) / 180;
  const risk = Math.max(0, Math.min(1, base));
  let risk_level = 'LOW';
  if (risk >= 0.8) risk_level = 'EXTREME';
  else if (risk >= 0.6) risk_level = 'HIGH';
  else if (risk >= 0.4) risk_level = 'MEDIUM';
  return { risk_score: risk, risk_level };
}

async function fetchCompleteEvents(limit = 5000) {
  // Pull fields needed
  const selectCols =
    'id,title,event_date,category,event_type,impact_level,location_name,latitude,longitude,country_code,planetary_snapshot,planetary_aspects';
  const { data, error } = await supabase.from('world_events').select(selectCols).limit(limit);
  if (error) throw new Error(`Fetch world_events failed: ${error.message}`);
  const complete = (data || []).filter(isCompleteEvent);
  return complete;
}

async function upsertPredictions(rows, useModelNameColumn = true) {
  // Upsert by (event_id, model_name) if model_name column exists
  if (!rows.length) return { upserted: 0 };

  // Check if model_name column exists on ml_predictions
  let hasModelName = useModelNameColumn;
  try {
    const { data, error } = await supabase.from('ml_predictions').select('model_name').limit(1);
    if (error) {
      hasModelName = false;
    } else if (data) {
      hasModelName = true;
    }
  } catch (e) {
    hasModelName = false;
  }

  const onConflict = hasModelName ? 'event_id,model_name' : undefined;

  // Batch insert/upsert
  const batchSize = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    let res;
    if (onConflict) {
      res = await supabase.from('ml_predictions').upsert(chunk, { onConflict });
    } else {
      res = await supabase.from('ml_predictions').insert(chunk);
    }
    if (res.error) {
      logger.warn('Upsert/Insert error:', res.error.message);
    } else {
      upserted += chunk.length;
    }
  }
  return { upserted };
}

async function main() {
  logger.info('🔧 Starting setup and generation of event-level predictions');
  const idType = await ensureMlPredictionsSchema();
  logger.info(`world_events.id detected/assumed type mapped to ml_predictions.event_id as: ${idType}`);

  logger.info('📥 Fetching complete events from world_events...');
  const events = await fetchCompleteEvents(10000);
  logger.info(`Complete events found: ${events.length}`);

  if (!events.length) {
    logger.info('No complete events to score. Exiting.');
    return;
  }

  // Build predictions
  logger.info('🧠 Generating predictions for complete events...');
  const modelName = 'event_model_v1';
  const modelVersion = '1.0';

  const rows = events.map((e) => {
    const feat = featureFromEvent(e);
    const scored = scoreRisk(feat);

    const categoryPreds = {};
    if (e.category) {
      categoryPreds[e.category] = { risk_score: scored.risk_score, confidence: 0.7 };
    }

    return {
      event_id: e.id,
      prediction_date: new Date().toISOString(),
      risk_level: scored.risk_level, // one of LOW/MEDIUM/HIGH/EXTREME
      risk_score: Number(scored.risk_score.toFixed(4)),
      confidence_score: 0.7,
      category_predictions: categoryPreds,
      historical_matches: null,
      planetary_snapshot: e.planetary_snapshot || null,
      aspects: e.planetary_aspects || null,
      location: {
        name: e.location_name || null,
        latitude: e.latitude,
        longitude: e.longitude,
        country_code: e.country_code || null,
      },
      model_info: {
        model_name: modelName,
        model_version: modelVersion,
        method: 'heuristic_v1',
        features_used: Object.keys(feat),
      },
      model_name: modelName, // if column exists
      models_used: [modelName],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Upsert predictions
  logger.info('💾 Writing predictions to ml_predictions...');
  const { upserted } = await upsertPredictions(rows, true);
  logger.info(`✅ Upserted predictions: ${upserted}`);

  logger.info('🎉 Completed setup and generation successfully.');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('💥 Fatal error in setupAndGeneratePredictions:', err);
      process.exit(1);
    });
}

module.exports = { main, ensureMlPredictionsSchema, detectWorldEventsIdType, fetchCompleteEvents, upsertPredictions };
