#!/usr/bin/env node

const { directSetup } = require('./setupDatabase');
const logger = require('../utils/logger');

/**
 * Direct database setup using postgres connection
 * This is more reliable than the RPC-based approach
 */
async function main() {
  try {
    console.log('🚀 Starting direct database setup...');
    console.log('📝 Make sure you have set your DATABASE_URL in .env file');
    console.log();
    
    await directSetup();
    
    console.log();
    console.log('✅ Database setup completed successfully!');
    console.log('🔧 Your Supabase database is now ready to use');
    console.log();
    console.log('Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Test the API endpoints');
    console.log('3. Verify with: node scripts/setupSampleData.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error();
    console.error('Troubleshooting:');
    console.error('1. Make sure DATABASE_URL is set in your .env file');
    console.error('2. Replace [YOUR-PASSWORD] with your actual Supabase password');
    console.error('3. Check your internet connection');
    console.error('4. Verify your Supabase project is not paused');
    
    process.exit(1);
  }
}

main();
