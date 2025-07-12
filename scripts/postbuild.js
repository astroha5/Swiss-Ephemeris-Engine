const fs = require('fs');
const path = require('path');

// Post-build script to ensure proper SPA routing for Render
console.log('🔧 Running post-build script for SPA routing...');

const buildDir = path.join(__dirname, '..', 'build');
const indexHtmlPath = path.join(buildDir, 'index.html');
const notFoundHtmlPath = path.join(buildDir, '404.html');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory does not exist. Make sure to run build first.');
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in build directory.');
  process.exit(1);
}

// Check if 404.html already exists to avoid duplicate work
if (fs.existsSync(notFoundHtmlPath)) {
  console.log('ℹ️ 404.html already exists, skipping creation');
  return;
}

// Read the index.html content
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Create a 404.html file that's identical to index.html for SPA routing
fs.writeFileSync(notFoundHtmlPath, indexHtml);

console.log('✅ Post-build script completed successfully!');
console.log('📁 Created 404.html for SPA routing fallback');
console.log('🚀 Your app is ready for deployment on Render!');
