#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT_DIR, 'package');
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

// Clean previous build
function cleanBuild() {
  step('Cleaning previous build...');
  if (fs.existsSync(BUILD_DIR)) {
    fs.removeSync(BUILD_DIR);
    success('Previous build cleaned');
  } else {
    log('No previous build found');
  }
}

// Create build directories
function createDirectories() {
  step('Creating build directories...');

  const directories = [
    BUILD_DIR,
    path.join(BUILD_DIR, 'conf'),
    path.join(BUILD_DIR, 'scripts'),
    path.join(BUILD_DIR, 'ui'),
    path.join(BUILD_DIR, 'ui', 'images'),
    path.join(BUILD_DIR, 'bin')
  ];

  directories.forEach(dir => {
    fs.ensureDirSync(dir);
  });

  success('Build directories created');
}

// Copy package files
function copyPackageFiles() {
  step('Copying package files...');

  const filesToCopy = [
    { src: 'INFO', dest: 'INFO' },
    { src: 'conf/privilege', dest: 'conf/privilege' },
    { src: 'conf/resource', dest: 'conf/resource' },
    { src: 'conf/n8n.sc', dest: 'conf/n8n.sc' },
    { src: 'scripts/installer', dest: 'scripts/installer' },
    { src: 'scripts/start-stop-status', dest: 'scripts/start-stop-status' },
    { src: 'ui/config', dest: 'ui/config' }
  ];

  filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(PACKAGE_DIR, src);
    const destPath = path.join(BUILD_DIR, dest);

    if (fs.existsSync(srcPath)) {
      fs.copySync(srcPath, destPath);
      log(`  • ${src} → ${dest}`);
    } else {
      warning(`  ⚠ File not found: ${src}`);
    }
  });

  success('Package files copied');
}

// Copy icons
function copyIcons() {
  step('Copying package icons...');

  let copiedIcons = 0;

  // Copy root-level PACKAGE_ICON files (DSM 7+ standard)
  // PACKAGE_ICON.PNG must be 64x64 (changed from 72x72 in DSM 6)
  // PACKAGE_ICON_256.PNG must be 256x256
  const rootIcons = [
    {
      src: path.join(ROOT_DIR, 'assets', 'logos', 'n8n', 'n8n-simple-icon-64.png'),
      dest: path.join(BUILD_DIR, 'PACKAGE_ICON.PNG'),
      name: 'PACKAGE_ICON.PNG (64x64)'
    },
    {
      src: path.join(ROOT_DIR, 'assets', 'logos', 'n8n', 'n8n-simple-icon-256.png'),
      dest: path.join(BUILD_DIR, 'PACKAGE_ICON_256.PNG'),
      name: 'PACKAGE_ICON_256.PNG (256x256)'
    }
  ];

  rootIcons.forEach(({ src, dest, name }) => {
    if (fs.existsSync(src)) {
      fs.copySync(src, dest);
      log(`  • ${name} copied`);
      copiedIcons++;
    } else {
      warning(`  ⚠ Icon not found: ${name}`);
    }
  });

  // Copy UI icons for Package Center display (multiple sizes)
  const uiIconSizes = [16, 24, 32, 48, 64, 72, 256];
  uiIconSizes.forEach(size => {
    const iconSrc = path.join(ROOT_DIR, 'assets', 'logos', 'n8n', `n8n-simple-icon-${size}.png`);
    const iconDest = path.join(BUILD_DIR, 'ui', 'images', `n8n-${size}.png`);

    if (fs.existsSync(iconSrc)) {
      fs.copySync(iconSrc, iconDest);
      log(`  • ui/images/n8n-${size}.png copied`);
      copiedIcons++;
    } else {
      warning(`  ⚠ UI icon not found: n8n-${size}.png`);
    }
  });

  // Copy SVG icon if present
  const svgSrc = path.join(ROOT_DIR, 'assets', 'logos', 'n8n', 'n8n-simple-icon.svg');
  const svgDest = path.join(BUILD_DIR, 'ui', 'images', 'n8n.svg');

  if (fs.existsSync(svgSrc)) {
    fs.copySync(svgSrc, svgDest);
    log(`  • ui/images/n8n.svg copied`);
    copiedIcons++;
  }

  if (copiedIcons > 0) {
    success(`${copiedIcons} icon(s) copied`);
  } else {
    warning('No icons found - package will use default icon');
  }
}

// Set executable permissions
function setPermissions() {
  step('Setting file permissions...');

  const executableFiles = [
    path.join(BUILD_DIR, 'scripts', 'installer'),
    path.join(BUILD_DIR, 'scripts', 'start-stop-status')
  ];

  executableFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.chmodSync(file, 0o755);
      log(`  • ${path.basename(file)} → executable`);
    }
  });

  success('Permissions set');
}

// Validate package structure
function validatePackage() {
  step('Validating package structure...');

  const requiredFiles = [
    'INFO',
    'conf/privilege',
    'conf/resource',
    'scripts/installer',
    'scripts/start-stop-status'
  ];

  let errors = 0;

  requiredFiles.forEach(file => {
    const filePath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(filePath)) {
      error(`  ✗ Required file missing: ${file}`);
      errors++;
    } else {
      log(`  • ${file} ✓`);
    }
  });

  if (errors > 0) {
    throw new Error(`Package validation failed: ${errors} required file(s) missing`);
  }

  success('Package structure validated');
}

// Read INFO file to get package details
function getPackageInfo() {
  const infoPath = path.join(BUILD_DIR, 'INFO');
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

// Calculate checksum
function calculateChecksum() {
  step('Calculating package checksum...');

  try {
    // Calculate MD5 checksum of all files
    const checksum = execSync(
      `find . -type f ! -name INFO -print0 | sort -z | xargs -0 cat | md5`,
      { cwd: BUILD_DIR, encoding: 'utf8' }
    ).trim();

    // Update INFO file with checksum
    const infoPath = path.join(BUILD_DIR, 'INFO');
    let infoContent = fs.readFileSync(infoPath, 'utf8');

    if (infoContent.includes('checksum=""')) {
      infoContent = infoContent.replace('checksum=""', `checksum="${checksum}"`);
    } else {
      infoContent = infoContent.replace(/checksum=".*?"/, `checksum="${checksum}"`);
    }

    fs.writeFileSync(infoPath, infoContent);

    log(`  • Checksum: ${checksum}`);
    success('Checksum calculated and updated');
  } catch (err) {
    warning('Could not calculate checksum - this may cause issues on some DSM versions');
    log(`  • Error: ${err.message}`);
  }
}

// Display build summary
function displaySummary() {
  const packageInfo = getPackageInfo();

  log('\n' + '='.repeat(60), colors.bright);
  log('Build Summary', colors.bright + colors.green);
  log('='.repeat(60), colors.bright);

  log(`\nPackage:     ${packageInfo.package || 'n8n'}`, colors.bright);
  log(`Version:     ${packageInfo.version || '1.0.0'}`, colors.bright);
  log(`Architecture: ${packageInfo.arch || 'noarch'}`, colors.bright);
  log(`Display Name: ${packageInfo.displayname || 'n8n'}`, colors.bright);
  log(`Min DSM:     ${packageInfo.os_min_ver || '7.0'}`, colors.bright);

  log('\n' + '='.repeat(60), colors.bright);
  log(`\nBuild Location: ${BUILD_DIR}`, colors.blue);
  log('\nNext step: Run "yarn package" to create the .spk file\n', colors.yellow);
}

// Main build process
async function build() {
  try {
    log('\n' + '='.repeat(60), colors.bright);
    log('n8n Synology Package Builder', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.bright);

    cleanBuild();
    createDirectories();
    copyPackageFiles();
    copyIcons();
    setPermissions();
    validatePackage();
    calculateChecksum();
    displaySummary();

    success('\n✓ Build completed successfully!\n');
    process.exit(0);
  } catch (err) {
    error(`\n✗ Build failed: ${err.message}\n`);
    console.error(err);
    process.exit(1);
  }
}

// Run build
build();