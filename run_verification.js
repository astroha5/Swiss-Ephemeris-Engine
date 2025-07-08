#!/usr/bin/env node

/**
 * VERIFICATION RUNNER SCRIPT
 * 
 * This script coordinates all verification tests for Obama's birth chart
 * to help identify calculation accuracy issues.
 * 
 * Usage:
 *   node run_verification.js              # Run main verification
 *   node run_verification.js --online     # Fetch online references first
 *   node run_verification.js --full       # Run complete verification suite
 *   node run_verification.js --backend    # Test only backend status
 * 
 */

const { spawn } = require('child_process');
const axios = require('axios');

// Color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print banner
 */
function printBanner() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│              ASTROVA VERIFICATION SUITE                     │');
  console.log('│           Testing Obama Chart Accuracy                     │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log(`${colors.reset}\n`);
}

/**
 * Check if backend is running
 */
async function checkBackendStatus() {
  console.log(`${colors.yellow}🔍 Checking backend status...${colors.reset}`);
  
  try {
    const response = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
    console.log(`${colors.green}✓ Backend is running${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Backend is not running${colors.reset}`);
    console.log(`${colors.yellow}💡 Start your backend with: cd backend && npm start${colors.reset}`);
    return false;
  }
}

/**
 * Run a script and return promise
 */
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}🚀 Running: ${scriptPath}${colors.reset}`);
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✅ ${scriptPath} completed successfully${colors.reset}\n`);
        resolve();
      } else {
        console.log(`${colors.red}❌ ${scriptPath} failed with code ${code}${colors.reset}\n`);
        reject(new Error(`Script failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`${colors.red}❌ Error running ${scriptPath}: ${error.message}${colors.reset}\n`);
      reject(error);
    });
  });
}

/**
 * Install missing dependencies
 */
async function installDependencies() {
  console.log(`${colors.yellow}📦 Checking dependencies...${colors.reset}`);
  
  const requiredPackages = ['moment-timezone', 'cheerio', 'puppeteer'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch (error) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.log(`${colors.yellow}Installing missing dependencies: ${missingPackages.join(', ')}${colors.reset}`);
    
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install', ...missingPackages], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`${colors.green}✓ Dependencies installed${colors.reset}`);
          resolve();
        } else {
          reject(new Error(`NPM install failed with code ${code}`));
        }
      });
    });
  } else {
    console.log(`${colors.green}✓ All dependencies are installed${colors.reset}`);
  }
}

/**
 * Main verification workflow
 */
async function runMainVerification() {
  console.log(`${colors.cyan}${colors.bright}=== MAIN VERIFICATION WORKFLOW ===${colors.reset}\n`);
  
  try {
    // Step 1: Check backend
    const backendRunning = await checkBackendStatus();
    
    // Step 2: Run main verification script
    console.log(`${colors.cyan}Running comprehensive verification...${colors.reset}`);
    await runScript('./reference_verification_script.js');
    
    // Step 3: Run your existing batch test
    if (backendRunning) {
      console.log(`${colors.cyan}Running existing batch test for comparison...${colors.reset}`);
      await runScript('./test_verified_charts_batch2.js');
    }
    
    console.log(`${colors.green}${colors.bright}🎉 Main verification complete!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Verification failed:${colors.reset}`, error.message);
  }
}

/**
 * Online reference fetching workflow
 */
async function runOnlineReferenceWorkflow() {
  console.log(`${colors.cyan}${colors.bright}=== ONLINE REFERENCE WORKFLOW ===${colors.reset}\n`);
  
  try {
    // Install web scraping dependencies
    await installDependencies();
    
    // Run online reference fetcher
    await runScript('./online_reference_fetcher.js');
    
    console.log(`${colors.green}${colors.bright}🌐 Online reference collection complete!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Online reference fetching failed:${colors.reset}`, error.message);
  }
}

/**
 * Full verification suite
 */
async function runFullVerificationSuite() {
  console.log(`${colors.cyan}${colors.bright}=== FULL VERIFICATION SUITE ===${colors.reset}\n`);
  
  try {
    // Step 1: Install dependencies
    await installDependencies();
    
    // Step 2: Check backend
    const backendRunning = await checkBackendStatus();
    
    // Step 3: Fetch online references (optional)
    console.log(`${colors.cyan}Attempting to fetch online references...${colors.reset}`);
    try {
      await runScript('./online_reference_fetcher.js');
    } catch (error) {
      console.log(`${colors.yellow}⚠ Online reference fetching failed, continuing with verification...${colors.reset}`);
    }
    
    // Step 4: Run main verification
    await runScript('./reference_verification_script.js');
    
    // Step 5: Run existing tests if backend is available
    if (backendRunning) {
      await runScript('./test_verified_charts_batch2.js');
    }
    
    console.log(`${colors.green}${colors.bright}🏆 FULL VERIFICATION SUITE COMPLETE!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Full verification suite failed:${colors.reset}`, error.message);
  }
}

/**
 * Backend-only test
 */
async function runBackendTest() {
  console.log(`${colors.cyan}${colors.bright}=== BACKEND STATUS TEST ===${colors.reset}\n`);
  
  const isRunning = await checkBackendStatus();
  
  if (isRunning) {
    console.log(`${colors.green}✅ Backend is operational${colors.reset}`);
    
    // Quick API test
    try {
      const testPayload = {
        date: "1961-08-04",
        time: "19:24",
        latitude: 21.3099,
        longitude: -157.8581,
        timezone: "Pacific/Honolulu",
        name: "Barack Obama",
        place: "Honolulu, Hawaii, USA"
      };
      
      console.log(`${colors.yellow}Testing API with Obama's data...${colors.reset}`);
      const response = await axios.post('http://localhost:3001/api/kundli', testPayload);
      
      if (response.data.success) {
        console.log(`${colors.green}✅ API call successful${colors.reset}`);
        console.log(`Ascendant: ${response.data.data.chartSummary.ascendant.degree} ${response.data.data.chartSummary.ascendant.sign}`);
        console.log(`Moon: ${response.data.data.chartSummary.moonSign.degree} ${response.data.data.chartSummary.moonSign.sign}`);
      } else {
        console.log(`${colors.red}❌ API returned error:${colors.reset}`, response.data.error);
      }
    } catch (error) {
      console.log(`${colors.red}❌ API test failed:${colors.reset}`, error.message);
    }
  } else {
    console.log(`${colors.red}❌ Backend is not running${colors.reset}`);
    console.log(`\n${colors.yellow}To start your backend:${colors.reset}`);
    console.log(`1. cd backend`);
    console.log(`2. npm install`);
    console.log(`3. npm start`);
  }
}

/**
 * Print usage help
 */
function printUsage() {
  console.log(`${colors.cyan}${colors.bright}USAGE:${colors.reset}`);
  console.log(`node run_verification.js                # Run main verification`);
  console.log(`node run_verification.js --online       # Fetch online references first`);
  console.log(`node run_verification.js --full         # Run complete verification suite`);
  console.log(`node run_verification.js --backend      # Test only backend status`);
  console.log(`node run_verification.js --help         # Show this help`);
  console.log(``);
  console.log(`${colors.yellow}RECOMMENDED WORKFLOW:${colors.reset}`);
  console.log(`1. Start your backend: cd backend && npm start`);
  console.log(`2. Run: node run_verification.js --full`);
  console.log(`3. Analyze the output to identify calculation differences`);
}

/**
 * Main execution
 */
async function main() {
  printBanner();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case '--online':
      await runOnlineReferenceWorkflow();
      break;
      
    case '--full':
      await runFullVerificationSuite();
      break;
      
    case '--backend':
      await runBackendTest();
      break;
      
    case '--help':
    case '-h':
      printUsage();
      break;
      
    default:
      await runMainVerification();
      break;
  }
}

// Run the verification suite
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { main };
