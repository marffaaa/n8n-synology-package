#!/usr/bin/env node

/**
 * Link Checker for n8n Synology Package Project
 *
 * Checks all URLs in Markdown, JSON, and HTML files to ensure they are accessible
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const REPORT_FILE = path.join(LOG_DIR, 'link-check-report.txt');

// Create logs directory
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Statistics
const stats = {
  total: 0,
  working: 0,
  broken: 0,
  skipped: 0,
  brokenUrls: [],
  workingUrls: [],
  skippedUrls: []
};

// Skip patterns
const SKIP_PATTERNS = [
  /localhost/,
  /127\.0\.0\.1/,
  /YOUR_NAS_IP/,
  /YOUR_USERNAME/,
  /your-nas/,
  /your-domain/
];

console.log('============================================================');
console.log('  Link Checker for n8n Synology Package');
console.log('============================================================\n');

// Initialize report
let report = `Link Check Report
Generated: ${new Date().toISOString()}
Project: n8n Synology Package
================================================================================\n\n`;

/**
 * Check if URL should be skipped
 */
function shouldSkip(url) {
  return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check single URL
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const options = {
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Link-Checker/1.0)'
        }
      };

      const req = protocol.request(url, options, (res) => {
        const statusCode = res.statusCode;

        // Follow redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          return checkUrl(res.headers.location).then(resolve);
        }

        resolve({
          url,
          status: statusCode,
          ok: statusCode >= 200 && statusCode < 400
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          status: 0,
          ok: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 0,
          ok: false,
          error: 'Timeout'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        url,
        status: 0,
        ok: false,
        error: error.message
      });
    }
  });
}

/**
 * Extract URLs from text
 */
function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s\]()<>"']+/g;
  const matches = text.match(urlRegex) || [];

  // Clean URLs (remove trailing punctuation)
  return matches.map(url => url.replace(/[,;:.)]+$/, ''));
}

/**
 * Check file for URLs
 */
async function checkFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  console.log(`\nChecking: ${relativePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const urls = [...new Set(extractUrls(content))]; // Remove duplicates

  if (urls.length === 0) {
    console.log('  No URLs found');
    return;
  }

  for (const url of urls) {
    stats.total++;

    if (shouldSkip(url)) {
      console.log(`  ⊙ SKIP: ${url}`);
      report += `SKIP: ${url} in ${relativePath} (localhost/placeholder)\n`;
      stats.skipped++;
      stats.skippedUrls.push(`${url} (${relativePath})`);
      continue;
    }

    const result = await checkUrl(url);

    if (result.ok) {
      console.log(`  ✓ ${result.status}: ${url}`);
      report += `OK (${result.status}): ${url} in ${relativePath}\n`;
      stats.working++;
      stats.workingUrls.push(`${url} (${relativePath})`);
    } else {
      const errorMsg = result.error ? ` - ${result.error}` : '';
      console.log(`  ✗ ${result.status || 'ERROR'}: ${url}${errorMsg}`);
      report += `BROKEN (${result.status || 'ERROR'}): ${url} in ${relativePath}${errorMsg}\n`;
      stats.broken++;
      stats.brokenUrls.push(`${url} (${relativePath})`);
    }
  }
}

/**
 * Find files recursively
 */
function findFiles(dir, extensions) {
  const files = [];

  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      // Skip node_modules and .git
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== '.git') {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Main function
 */
async function main() {
  console.log('Scanning project for URLs...\n');

  // Find all Markdown, JSON, and HTML files
  const extensions = ['.md', '.json', '.html'];
  const files = findFiles(PROJECT_ROOT, extensions);

  // Filter out package-lock.json
  const filesToCheck = files.filter(f => !f.includes('package-lock.json'));

  console.log(`Found ${filesToCheck.length} files to check\n`);

  // Check each file
  for (const file of filesToCheck) {
    await checkFile(file);
  }

  // Generate summary
  report += `\n================================================================================\n`;
  report += `SUMMARY\n`;
  report += `================================================================================\n`;
  report += `Total URLs found:    ${stats.total}\n`;
  report += `Working URLs:        ${stats.working}\n`;
  report += `Broken URLs:         ${stats.broken}\n`;
  report += `Skipped URLs:        ${stats.skipped}\n\n`;

  if (stats.broken > 0) {
    report += `Broken URLs:\n`;
    report += `=================================================================================\n`;
    stats.brokenUrls.forEach(url => {
      report += `  - ${url}\n`;
    });
    report += `\n`;
  }

  // Save report
  fs.writeFileSync(REPORT_FILE, report, 'utf8');

  // Print summary
  console.log('\n============================================================');
  console.log('  Summary');
  console.log('============================================================\n');
  console.log(`Total URLs found:    ${stats.total}`);
  console.log(`Working URLs:        ${stats.working}`);
  console.log(`Broken URLs:         ${stats.broken}`);
  console.log(`Skipped URLs:        ${stats.skipped}\n`);

  if (stats.broken > 0) {
    console.log('Broken URLs:');
    stats.brokenUrls.forEach(url => {
      console.log(`  - ${url}`);
    });
    console.log('');
  }

  console.log(`Report saved to: ${REPORT_FILE}\n`);

  if (stats.broken > 0) {
    console.log(`✗ Link check failed: ${stats.broken} broken URL(s) found`);
    process.exit(1);
  } else {
    console.log('✓ All links are working!');
    process.exit(0);
  }
}

// Run
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});