const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
const logger = require('../utils/logger');

const supabaseUrl = 'https://ypscvzznlrxjeqkjasmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc2N2enpubHJ4amVxa2phc21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjk1NzIsImV4cCI6MjA2ODg0NTU3Mn0.KIe0Rqk5WC27hIyrgWHjS1aMaU2U2UcmrDJMq4q6H6w';

// Direct postgres connection for database operations
// Note: For Supabase, direct connections can be unreliable, so we'll use the Supabase client instead
const databaseUrl = process.env.DATABASE_URL;
let sql = null;

// Try to create direct PostgreSQL connection (enabled by default for Supabase Direct Connection)
if (databaseUrl) {
  try {
    sql = postgres(databaseUrl, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    logger.info('Direct PostgreSQL connection configured (optional)');
  } catch (error) {
    logger.warn('Direct PostgreSQL connection failed to configure:', error.message);
    logger.info('Continuing with Supabase client only');
    sql = null;
  }
} else {
  logger.info('Direct PostgreSQL connection disabled (using Supabase client only)');
}

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase configuration');
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Since this is a backend service
  },
  db: {
    schema: 'public'
  }
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('world_events').select('count', { count: 'exact', head: true });
    if (error) {
      logger.warn('Supabase connection test failed:', error.message);
    } else {
      logger.info('✅ Supabase connection established successfully');
    }
  } catch (err) {
    logger.error('Failed to test Supabase connection:', err.message);
  }
}

// Initialize connection test
testConnection();

module.exports = { supabase, sql };

// Create a per-request client that uses the caller's JWT for RLS
module.exports.createAuthedClient = function createAuthedClient(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  });
};
