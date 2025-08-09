const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let postgres;
try {
  postgres = require('postgres');
} catch (error) {
  console.error('❌ postgres package not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install postgres', { stdio: 'inherit' });
  postgres = require('postgres');
}

async function run() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const sql = postgres(connectionString, { ssl: 'require' });
    const createPrefsPath = path.join(__dirname, '../database/migrations/00_create_user_preferences.sql');
    const addSubsPath = path.join(__dirname, '../database/migrations/02_add_subscription_columns_to_user_preferences.sql');
    const migrationSQL = [
      fs.readFileSync(createPrefsPath, 'utf8'),
      fs.readFileSync(addSubsPath, 'utf8')
    ].join('\n\n');

    console.log('🚀 Executing subscription migration...');
    await sql.unsafe(migrationSQL);
    console.log('✅ Subscription migration completed.');
    await sql.end();
  } catch (err) {
    console.error('❌ Subscription migration failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };


