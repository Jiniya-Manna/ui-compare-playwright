#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find the latest individual blog report
const testResultsDir = path.join(__dirname, '../test-results');

try {
  // Look for individual blog comparison files
  const files = fs.readdirSync(testResultsDir);
  const individualBlogFiles = files.filter(file => 
    file.startsWith('individual-blog') && file.endsWith('-latest-comparison.html')
  );
  
  if (individualBlogFiles.length > 0) {
    const latestFile = individualBlogFiles[0]; // Take the first one
    const fullPath = path.join(testResultsDir, latestFile);
    
    console.log(`Opening: ${fullPath}`);
    execSync(`open "${fullPath}"`, { stdio: 'inherit' });
  } else {
    console.log('No individual blog comparison reports found.');
    console.log('Run: npm run test:individual-blog first');
  }
} catch (error) {
  console.log('Error finding individual blog report:', error.message);
}
