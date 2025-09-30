#!/usr/bin/env node

/**
 * Updates the Synology repository index file (docs/index.json)
 * with the latest release information from GitHub
 */

const fs = require('fs');
const path = require('path');

// Get version and download URL from command line or environment
const VERSION = process.env.VERSION || process.argv[2];
const DOWNLOAD_URL = process.env.DOWNLOAD_URL || process.argv[3];

if (!VERSION || !DOWNLOAD_URL) {
  console.error('Usage: update-repository-index.js <version> <download_url>');
  console.error('Example: update-repository-index.js 1.0.0 https://github.com/.../n8n-1.0.0-noarch.spk');
  process.exit(1);
}

const INDEX_FILE = path.join(__dirname, '../docs/index.json');

// Read INFO file to get package metadata
const INFO_FILE = path.join(__dirname, '../package/INFO');
const infoContent = fs.readFileSync(INFO_FILE, 'utf8');

function parseInfoValue(key) {
  const regex = new RegExp(`^${key}="(.+)"$`, 'm');
  const match = infoContent.match(regex);
  return match ? match[1] : '';
}

// Read CHANGELOG to get latest changes
const CHANGELOG_FILE = path.join(__dirname, '../CHANGELOG.md');
const changelogContent = fs.readFileSync(CHANGELOG_FILE, 'utf8');

// Extract changelog for current version
function getChangelogForVersion(version) {
  const versionRegex = new RegExp(`## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`);
  const match = changelogContent.match(versionRegex);
  return match ? match[0].trim() : `Release version ${version}`;
}

const changelog = getChangelogForVersion(VERSION);

// Create package entry
const packageEntry = {
  package: parseInfoValue('package'),
  version: VERSION,
  dname: parseInfoValue('displayname'),
  desc: parseInfoValue('description') + ' This package uses Docker Compose with PostgreSQL for a production-ready deployment.',
  link: DOWNLOAD_URL,
  thumbnail: [
    'https://raw.githubusercontent.com/josedacosta/n8n-synology-package/main/package/ui/images/n8n-logo.svg',
    'https://raw.githubusercontent.com/josedacosta/n8n-synology-package/main/package/ui/images/n8n_256.png',
    'https://raw.githubusercontent.com/josedacosta/n8n-synology-package/main/package/ui/images/n8n_72.png'
  ],
  snapshot: [
    'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot.png'
  ],
  qinst: parseInfoValue('silent_install') === 'yes',
  qstart: true,
  qupgrade: parseInfoValue('silent_upgrade') === 'yes',
  depsers: null,
  deppkgs: null,
  conflictpkgs: null,
  start: true,
  maintainer: parseInfoValue('maintainer'),
  maintainer_url: parseInfoValue('maintainer_url'),
  distributor: parseInfoValue('distributor'),
  distributor_url: parseInfoValue('distributor_url'),
  support_url: 'https://github.com/josedacosta/n8n-synology-package/issues',
  thirdparty: parseInfoValue('thirdparty') === 'yes',
  os_min_ver: parseInfoValue('os_min_ver'),
  beta: parseInfoValue('beta') === 'yes',
  changelog: 'https://raw.githubusercontent.com/josedacosta/n8n-synology-package/main/CHANGELOG.md'
};

// Read existing index or create new one
let index;
try {
  index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
} catch (error) {
  console.log('Creating new index file...');
  index = { packages: [] };
}

// Update or add package entry
const existingIndex = index.packages.findIndex(pkg => pkg.package === packageEntry.package);
if (existingIndex >= 0) {
  console.log(`Updating package ${packageEntry.package} to version ${VERSION}`);
  index.packages[existingIndex] = packageEntry;
} else {
  console.log(`Adding new package ${packageEntry.package} version ${VERSION}`);
  index.packages.push(packageEntry);
}

// Write updated index
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + '\n');

console.log('✓ Repository index updated successfully');
console.log(`  Package: ${packageEntry.package}`);
console.log(`  Version: ${VERSION}`);
console.log(`  Download: ${DOWNLOAD_URL}`);
console.log(`\nRepository URL for Synology Package Center:`);
console.log(`  https://josedacosta.github.io/n8n-synology-package/index.json`);