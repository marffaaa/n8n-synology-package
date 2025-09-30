#!/usr/bin/env node

/**
 * Script to update the Synology package repository
 * This script updates packages.json with the latest package information
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const repoDir = path.join(__dirname, '..', 'repo');
const distDir = path.join(__dirname, '..', 'dist');
const packageInfoPath = path.join(distDir, 'build', 'INFO');
const packagesJsonPath = path.join(repoDir, 'packages.json');
const indexJsonPath = path.join(repoDir, 'index.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}➜ ${title}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

// Parse INFO file
function parseInfoFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const info = {};

  content.split('\n').forEach(line => {
    const match = line.match(/^(\w+)="([^"]*)"$/);
    if (match) {
      info[match[1]] = match[2];
    }
  });

  return info;
}

// Get file size
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

// Calculate MD5 checksum
function calculateMD5(filePath) {
  try {
    const output = execSync(`md5 -q "${filePath}" 2>/dev/null || md5sum "${filePath}" | awk '{print $1}'`);
    return output.toString().trim();
  } catch (error) {
    logError(`Failed to calculate MD5: ${error.message}`);
    return null;
  }
}

// Main function
function updateRepository() {
  log('\n' + '='.repeat(60), colors.bright);
  log('Synology Package Repository Updater', colors.bright + colors.green);
  log('='.repeat(60) + '\n', colors.bright);

  // Check if build exists
  if (!fs.existsSync(packageInfoPath)) {
    logError('Package INFO not found. Run "yarn build" first.');
    process.exit(1);
  }

  logSection('Reading package information...');
  const packageInfo = parseInfoFile(packageInfoPath);
  logSuccess(`Package: ${packageInfo.package} v${packageInfo.version}`);

  // Find .spk file
  const spkFileName = `${packageInfo.package}-${packageInfo.version}-${packageInfo.arch}.spk`;
  const spkFilePath = path.join(distDir, spkFileName);

  if (!fs.existsSync(spkFilePath)) {
    logError(`.spk file not found: ${spkFileName}`);
    logWarning('Run "yarn package" first.');
    process.exit(1);
  }

  logSection('Calculating package metadata...');
  const fileSize = getFileSize(spkFilePath);
  const checksum = calculateMD5(spkFilePath);

  log(`  • File: ${spkFileName}`);
  log(`  • Size: ${(fileSize / 1024).toFixed(2)} KB`);
  log(`  • MD5: ${checksum}`);

  // Create repo directory if it doesn't exist
  if (!fs.existsSync(repoDir)) {
    fs.mkdirSync(repoDir, { recursive: true });
    logSuccess('Created repo directory');
  }

  // Copy .spk to repo
  logSection('Copying package to repository...');
  const repoSpkPath = path.join(repoDir, spkFileName);
  fs.copyFileSync(spkFilePath, repoSpkPath);
  logSuccess(`Copied to repo/${spkFileName}`);

  // Update repository files
  logSection('Updating repository files...');

  let packagesData = { packages: [] };
  // Check index.json first (Synology standard), then packages.json for backwards compatibility
  if (fs.existsSync(indexJsonPath)) {
    packagesData = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
  } else if (fs.existsSync(packagesJsonPath)) {
    packagesData = JSON.parse(fs.readFileSync(packagesJsonPath, 'utf8'));
  }

  // Remove old version of the same package
  packagesData.packages = packagesData.packages.filter(
    pkg => pkg.package !== packageInfo.package
  );

  // Generate icon URLs (use GitHub Pages URLs like SynoCommunity pattern)
  // Pattern: https://josedacosta.github.io/n8n-synology-package/packages/{package}/{version}/icon_{size}.png
  const baseIconUrl = `https://josedacosta.github.io/n8n-synology-package/packages/${packageInfo.package}/${packageInfo.version}`;
  const icon72Url = `${baseIconUrl}/icon_72.png`;
  const icon256Url = `${baseIconUrl}/icon_256.png`;

  // Add new package
  const newPackage = {
    package: packageInfo.package,
    version: packageInfo.version,
    dname: packageInfo.displayname,
    desc: packageInfo.description,
    link: packageInfo.maintainer_url,
    download_count: 0,
    thumbnail: [icon72Url, icon256Url],
    snapshot: [],
    qinst: packageInfo.silent_install === 'yes',
    qstart: false,
    qupgrade: packageInfo.silent_upgrade === 'yes',
    depsers: null,
    deppkgs: packageInfo.install_dep_packages || null,
    conflictpkgs: packageInfo.install_conflict_packages || null,
    start: true,
    maintainer: packageInfo.maintainer,
    maintainer_url: packageInfo.maintainer_url,
    distributor: packageInfo.distributor,
    distributor_url: packageInfo.distributor_url,
    support_url: packageInfo.support_url,
    thirdparty: packageInfo.thirdparty === 'yes',
    distribute: true,
    type: 0,
    icon: icon72Url,
    size: fileSize,
    checksum: checksum,
    os_min_ver: packageInfo.os_min_ver,
    arch: packageInfo.arch,
    changelog: packageInfo.changelog,
    beta: packageInfo.beta === 'yes',
    report_url: packageInfo.support_url
  };

  packagesData.packages.push(newPackage);

  // Write packages.json
  fs.writeFileSync(
    packagesJsonPath,
    JSON.stringify(packagesData, null, 2),
    'utf8'
  );
  logSuccess('packages.json updated');

  // Also write index.json for Synology Package Center compatibility
  fs.writeFileSync(
    indexJsonPath,
    JSON.stringify(packagesData, null, 2),
    'utf8'
  );
  logSuccess('index.json updated');

  // Summary
  log('\n' + '='.repeat(60), colors.bright);
  log('Repository Update Summary', colors.bright + colors.green);
  log('='.repeat(60), colors.bright);
  log(`\nPackage:      ${packageInfo.package}`);
  log(`Version:      ${packageInfo.version}`);
  log(`Display Name: ${packageInfo.displayname}`);
  log(`Architecture: ${packageInfo.arch}`);
  log(`Min DSM:      ${packageInfo.os_min_ver}`);
  log('\n' + '='.repeat(60), colors.bright);
  log('\nRepository Location:', colors.blue);
  log(`  ${repoDir}`);
  log('\nNext Steps:', colors.yellow + colors.bright);
  log('  1. Commit the changes: git add repo/ && git commit -m "chore: update package repository"');
  log('  2. Push to GitHub: git push');
  log('  3. GitHub Pages will deploy automatically');
  log('\nRepository URL:', colors.blue);
  log('  https://josedacosta.github.io/n8n-synology-package/repo/\n');

  logSuccess('\n✓ Repository update completed successfully!\n');
}

// Run
try {
  updateRepository();
} catch (error) {
  logError(`\nError: ${error.message}`);
  process.exit(1);
}