#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find the latest blog tag report
const testResultsDir = path.join(__dirname, '../test-results');

try {
  // Look for blog tag comparison files
  const files = fs.readdirSync(testResultsDir);
  const blogTagFiles = files.filter(file => 
    file.startsWith('blog-tag') && file.endsWith('-latest-comparison.html')
  );
  
  if (blogTagFiles.length > 0) {
    const latestFile = blogTagFiles[0]; // Take the first one
    const fullPath = path.join(testResultsDir, latestFile);
    
    console.log(`Opening: ${fullPath}`);
    execSync(`open "${fullPath}"`, { stdio: 'inherit' });
  } else {
    console.log('No blog tag comparison reports found.');
    console.log('Run: npm run test:blog-tag first');
  }
} catch (error) {
  console.log('Error finding blog tag report:', error.message);
}
