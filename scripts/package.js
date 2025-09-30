#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BUILD_DIR = path.join(DIST_DIR, 'build');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function step(message) {
  log(`\n➜ ${message}`, colors.blue + colors.bright);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Read INFO file to get package details
function getPackageInfo() {
  const infoPath = path.join(BUILD_DIR, 'INFO');

  if (!fs.existsSync(infoPath)) {
    throw new Error('INFO file not found. Please run "yarn build" first.');
  }

  const infoContent = fs.readFileSync(infoPath, 'utf8');
  const packageInfo = {};

  infoContent.split('\n').forEach(line => {
    const match = line.match(/^(\w+)="?([^"]*)"?$/);
    if (match) {
      packageInfo[match[1]] = match[2];
    }
  });

  return packageInfo;
}

// Create package.tgz
function createPackageTgz() {
  return new Promise((resolve, reject) => {
    step('Creating package.tgz...');

    const packageTgzPath = path.join(BUILD_DIR, 'package.tgz');
    const output = fs.createWriteStream(packageTgzPath);
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: {
        level: 9
      }
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      success(`package.tgz created (${size} MB)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files except INFO and package.tgz itself
    const files = fs.readdirSync(BUILD_DIR);
    files.forEach(file => {
      if (file !== 'INFO' && file !== 'package.tgz') {
        const filePath = path.join(BUILD_DIR, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          archive.directory(filePath, file);
          log(`  • Adding directory: ${file}/`);
        } else {
          archive.file(filePath, { name: file });
          log(`  • Adding file: ${file}`);
        }
      }
    });

    archive.finalize();
  });
}

// Create final .spk file
function createSpkFile(packageInfo) {
  return new Promise((resolve, reject) => {
    step('Creating .spk package...');

    const packageName = packageInfo.package || 'n8n';
    const packageVersion = packageInfo.version || '1.0.0';
    const arch = packageInfo.arch || 'noarch';

    const spkFileName = `${packageName}-${packageVersion}-${arch}.spk`;
    const spkFilePath = path.join(DIST_DIR, spkFileName);

    // Remove existing .spk if present
    if (fs.existsSync(spkFilePath)) {
      fs.removeSync(spkFilePath);
    }

    const output = fs.createWriteStream(spkFilePath);
    const archive = archiver('tar', {
      gzip: false // SPK files are uncompressed tar archives
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      success(`.spk package created (${size} MB)`);
      resolve(spkFilePath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add INFO file
    archive.file(path.join(BUILD_DIR, 'INFO'), { name: 'INFO' });
    log(`  • Adding: INFO`);

    // Add package.tgz
    archive.file(path.join(BUILD_DIR, 'package.tgz'), { name: 'package.tgz' });
    log(`  • Adding: package.tgz`);

    archive.finalize();
  });
}

// Calculate and display final checksum
function displayChecksum(spkFilePath) {
  step('Calculating final package checksum...');

  try {
    const md5 = execSync(`md5 -q "${spkFilePath}"`, { encoding: 'utf8' }).trim();
    const sha256 = execSync(`shasum -a 256 "${spkFilePath}" | awk '{print $1}'`, { encoding: 'utf8' }).trim();

    log(`\n  MD5:    ${md5}`, colors.bright);
    log(`  SHA256: ${sha256}`, colors.bright);

    success('Checksums calculated');
  } catch (err) {
    warning('Could not calculate checksums');
  }
}

// Display package summary
function displaySummary(spkFilePath, packageInfo) {
  log('\n' + '='.repeat(60), colors.bright);
  log('Package Summary', colors.bright + colors.green);
  log('='.repeat(60), colors.bright);

  log(`\nPackage:      ${packageInfo.package || 'n8n'}`, colors.bright);
  log(`Version:      ${packageInfo.version || '1.0.0'}`, colors.bright);
  log(`Display Name: ${packageInfo.displayname || 'n8n'}`, colors.bright);
  log(`Architecture: ${packageInfo.arch || 'noarch'}`, colors.bright);
  log(`Min DSM:      ${packageInfo.os_min_ver || '7.0'}`, colors.bright);

  const stat = fs.statSync(spkFilePath);
  const size = (stat.size / 1024 / 1024).toFixed(2);

  log('\n' + '='.repeat(60), colors.bright);
  log(`\nPackage File: ${path.basename(spkFilePath)}`, colors.blue);
  log(`Location:     ${spkFilePath}`, colors.blue);
  log(`Size:         ${size} MB`, colors.blue);

  log('\n' + '='.repeat(60), colors.bright);
  log('\nInstallation Instructions:', colors.yellow + colors.bright);
  log('='.repeat(60), colors.bright);
  log('\n1. Open Synology DSM Package Center');
  log('2. Click "Manual Install" button');
  log('3. Select the .spk file');
  log('4. Follow the installation wizard');
  log('5. Access n8n at http://YOUR_NAS_IP:5678\n');
}

// Cleanup temporary files
function cleanup() {
  step('Cleaning up temporary files...');

  const packageTgzPath = path.join(BUILD_DIR, 'package.tgz');
  if (fs.existsSync(packageTgzPath)) {
    fs.removeSync(packageTgzPath);
    success('package.tgz removed');
  }
}

// Main packaging process
async function packageSpk() {
  try {
    log('\n' + '='.repeat(60), colors.bright);
    log('n8n Synology Package Creator', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.bright);

    // Check if build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
      throw new Error('Build directory not found. Please run "yarn build" first.');
    }

    // Get package info
    const packageInfo = getPackageInfo();

    // Create package.tgz
    await createPackageTgz();

    // Create .spk file
    const spkFilePath = await createSpkFile(packageInfo);

    // Display checksum
    displayChecksum(spkFilePath);

    // Cleanup
    cleanup();

    // Display summary
    displaySummary(spkFilePath, packageInfo);

    success('\n✓ Packaging completed successfully!\n');
    process.exit(0);
  } catch (err) {
    error(`\n✗ Packaging failed: ${err.message}\n`);
    console.error(err);
    process.exit(1);
  }
}

// Run packaging
packageSpk();