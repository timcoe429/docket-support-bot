#!/usr/bin/env node

/**
 * JavaScript Syntax Validation Script
 * Checks all JavaScript files for syntax errors before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to check
const directoriesToCheck = [
  path.join(__dirname, '..', 'api'),
  path.join(__dirname, '..', 'lib'),
  path.join(__dirname, '..', 'public')
];

// Files to exclude
const excludePatterns = [
  /node_modules/,
  /\.min\.js$/,
  /\.bundle\.js$/
];

/**
 * Recursively find all JavaScript files
 */
function findJSFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!excludePatterns.some(pattern => pattern.test(filePath))) {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !excludePatterns.some(pattern => pattern.test(filePath))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Validate a single JavaScript file using node --check
 */
function validateFile(filePath) {
  return new Promise((resolve) => {
    const relativePath = path.relative(process.cwd(), filePath);
    const nodeProcess = spawn('node', ['--check', filePath], {
      stdio: 'pipe'
    });

    let stderr = '';

    nodeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    nodeProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ valid: true, file: relativePath, error: null });
      } else {
        resolve({ valid: false, file: relativePath, error: stderr || 'Syntax error' });
      }
    });

    nodeProcess.on('error', (error) => {
      resolve({ valid: false, file: relativePath, error: error.message });
    });
  });
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 Validating JavaScript files...\n');

  // Find all JS files
  const jsFiles = [];
  directoriesToCheck.forEach(dir => {
    const files = findJSFiles(dir);
    jsFiles.push(...files);
  });

  if (jsFiles.length === 0) {
    console.log('⚠️  No JavaScript files found to validate.');
    process.exit(0);
  }

  console.log(`Found ${jsFiles.length} JavaScript file(s) to validate.\n`);

  // Validate each file
  const results = await Promise.all(jsFiles.map(file => validateFile(file)));

  let allValid = true;
  const errors = [];

  results.forEach(result => {
    if (result.valid) {
      console.log(`✅ ${result.file}`);
    } else {
      console.error(`❌ ${result.file}`);
      if (result.error) {
        console.error(`   ${result.error.trim()}\n`);
      }
      allValid = false;
      errors.push(result);
    }
  });

  console.log('');

  if (!allValid) {
    console.error('❌ Validation failed!');
    console.error(`\nFound ${errors.length} error(s):\n`);
    errors.forEach(({ file, error }) => {
      console.error(`  ${file}:`);
      if (error) {
        console.error(`    ${error.trim()}\n`);
      }
    });
    process.exit(1);
  } else {
    console.log('✅ All JavaScript files are valid!');
    process.exit(0);
  }
}

// Run validation
main().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
