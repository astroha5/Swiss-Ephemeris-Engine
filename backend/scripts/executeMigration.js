const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import postgres
let postgres;
try {
  postgres = require('postgres');
} catch (error) {
  console.error('❌ postgres package not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install postgres', { stdio: 'inherit' });
  postgres = require('postgres');
}

async function executeMigration() {
  console.log('🚀 Starting migration to add planetary columns to world_events table...');
  
  try {
    // Create postgres connection using direct connection (not pooled)
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    // Convert pooled connection to direct connection for migration
    const directConnectionString = connectionString.replace(
      'aws-0-us-west-1.pooler.supabase.com:6543',
      'db.ypscvzznlrxjeqkjasmb.supabase.co:5432'
    );
    
    console.log('🔗 Connecting to database...');
    const sql = postgres(connectionString);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/01_add_planetary_columns_to_world_events.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    console.log('Migration content:');
    console.log(migrationSQL);
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    console.log('🔍 Verifying new columns...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'world_events' 
      AND column_name IN ('planetary_snapshot', 'planetary_aspects')
      ORDER BY column_name;
    `;
    
    if (columns.length === 2) {
      console.log('✅ New columns verified:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('⚠️  Column verification failed. Found columns:', columns);
    }
    
    // Close connection
    await sql.end();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  executeMigration();
}

module.exports = { executeMigration };
