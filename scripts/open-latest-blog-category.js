#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find the latest blog category report
const testResultsDir = path.join(__dirname, '../test-results');

try {
  // Look for blog category comparison files
  const files = fs.readdirSync(testResultsDir);
  const blogCategoryFiles = files.filter(file => 
    file.startsWith('blog-category') && file.endsWith('-latest-comparison.html')
  );
  
  if (blogCategoryFiles.length > 0) {
    const latestFile = blogCategoryFiles[0]; // Take the first one
    const fullPath = path.join(testResultsDir, latestFile);
    
    console.log(`Opening: ${fullPath}`);
    execSync(`open "${fullPath}"`, { stdio: 'inherit' });
  } else {
    console.log('No blog category comparison reports found.');
    console.log('Run: npm run test:blog-category first');
  }
} catch (error) {
  console.log('Error finding blog category report:', error.message);
}
