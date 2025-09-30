#!/usr/bin/env tsx

/**
 * Script to check version consistency across the project
 * Verifies that versions are synchronized between:
 * - package.json
 * - package/INFO
 * - CHANGELOG.md (latest version)
 * - dist/build/INFO (if built)
 * - repo/packages.json (repository metadata)
 * - README.md (documentation examples)
 * - UPGRADING.md (migration guides)
 * - SECURITY.md (supported versions)
 * - scripts/package.js (fallback version)
 * - GitHub release URLs in CHANGELOG.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
} as const;

// Helper functions for colored logging
const log = {
    error: (msg: string): void => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    success: (msg: string): void => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    info: (msg: string): void => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    warning: (msg: string): void => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

// Get project root directory
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Type definitions
interface Versions {
    packageJson?: string;
    info?: string;
    changelog?: string;
    build?: string | null;
    repoPackages?: string | null;
    readmeExamples?: string[];
    changelogUrls?: string[];
    upgradingVersions?: string[];
    securityVersions?: string[];
    packageJsFallback?: string | null;
}

interface PackageJson {
    version: string;

    [key: string]: any;
}

interface RepoPackagesJson {
    packages: Array<{
        name?: string;
        package?: string;
        version?: string;
        [key: string]: any;
    }>;
}

/**
 * Read version from package.json
 */
function getPackageJsonVersion(): string {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }

    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
}

/**
 * Read version from package/INFO file
 */
function getInfoVersion(): string {
    const infoPath = path.join(PROJECT_ROOT, 'package', 'INFO');

    if (!fs.existsSync(infoPath)) {
        throw new Error('package/INFO not found');
    }

    const infoContent = fs.readFileSync(infoPath, 'utf8');
    const versionMatch = infoContent.match(/^version="([^"]+)"/m);

    if (!versionMatch) {
        throw new Error('Version not found in package/INFO');
    }

    return versionMatch[1];
}

/**
 * Read latest version from CHANGELOG.md
 */
function getChangelogVersion(): string | null {
    const changelogPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');

    if (!fs.existsSync(changelogPath)) {
        return null;
    }

    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    // Match version in format: ## [1.0.0] - YYYY-MM-DD
    const versionMatch = changelogContent.match(/^## \[([0-9]+\.[0-9]+\.[0-9]+)\]/m);

    return versionMatch ? versionMatch[1] : null;
}

/**
 * Check if version exists in build output (if present)
 */
function checkBuildVersion(): string | null {
    const buildInfoPath = path.join(PROJECT_ROOT, 'dist', 'build', 'INFO');

    if (!fs.existsSync(buildInfoPath)) {
        return null; // Build doesn't exist yet, that's ok
    }

    const infoContent = fs.readFileSync(buildInfoPath, 'utf8');
    const versionMatch = infoContent.match(/^version="([^"]+)"/m);

    return versionMatch ? versionMatch[1] : null;
}

/**
 * Check if .spk file exists with correct version
 */
function checkSpkVersion(expectedVersion: string): string | null {
    const distDir = path.join(PROJECT_ROOT, 'dist');

    if (!fs.existsSync(distDir)) {
        return null; // Dist doesn't exist yet, that's ok
    }

    const spkFile = `n8n-${expectedVersion}-noarch.spk`;
    const spkPath = path.join(distDir, spkFile);

    return fs.existsSync(spkPath) ? spkFile : null;
}

/**
 * Check version in repo/packages.json
 */
function getRepoPackagesVersion(): string | null {
    const repoPackagesPath = path.join(PROJECT_ROOT, 'repo', 'packages.json');

    if (!fs.existsSync(repoPackagesPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(repoPackagesPath, 'utf8');
        const data: RepoPackagesJson = JSON.parse(content);

        // Find n8n package
        const n8nPackage = data.packages?.find(pkg => pkg.name === 'n8n' || pkg.package === 'n8n');
        return n8nPackage?.version || null;
    } catch (error) {
        return null;
    }
}

/**
 * Check version references in README.md
 */
function getReadmeVersionExamples(): string[] {
    const readmePath = path.join(PROJECT_ROOT, 'README.md');

    if (!fs.existsSync(readmePath)) {
        return [];
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    const versionPattern = /n8n-(\d+\.\d+\.\d+)-noarch\.spk|version="?(\d+\.\d+\.\d+)"?|v(\d+\.\d+\.\d+)/gi;
    const matches: string[] = [];
    let match;

    while ((match = versionPattern.exec(content)) !== null) {
        const version = match[1] || match[2] || match[3];
        if (version && !matches.includes(version)) {
            matches.push(version);
        }
    }

    return matches;
}

/**
 * Check GitHub release URLs in CHANGELOG.md
 */
function getChangelogUrls(): string[] {
    const changelogPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');

    if (!fs.existsSync(changelogPath)) {
        return [];
    }

    const content = fs.readFileSync(changelogPath, 'utf8');
    const urlPattern = /\[(\d+\.\d+\.\d+)\]:|compare\/v(\d+\.\d+\.\d+)|tag\/v(\d+\.\d+\.\d+)/gi;
    const versions: string[] = [];
    let match;

    while ((match = urlPattern.exec(content)) !== null) {
        const version = match[1] || match[2] || match[3];
        if (version && !versions.includes(version)) {
            versions.push(version);
        }
    }

    return versions;
}

/**
 * Check version references in UPGRADING.md
 */
function getUpgradingVersions(): string[] {
    const upgradingPath = path.join(PROJECT_ROOT, 'UPGRADING.md');

    if (!fs.existsSync(upgradingPath)) {
        return [];
    }

    const content = fs.readFileSync(upgradingPath, 'utf8');
    const versionPattern = /(\d+\.\d+\.\d+)/g;
    const matches: string[] = [];
    let match;

    while ((match = versionPattern.exec(content)) !== null) {
        const version = match[1];
        // Exclude n8n docker image versions (like 0.236.0)
        if (version && !version.startsWith('0.') && !matches.includes(version)) {
            matches.push(version);
        }
    }

    return matches;
}

/**
 * Check version references in SECURITY.md
 */
function getSecurityVersions(): string[] {
    const securityPath = path.join(PROJECT_ROOT, 'SECURITY.md');

    if (!fs.existsSync(securityPath)) {
        return [];
    }

    const content = fs.readFileSync(securityPath, 'utf8');
    const versionPattern = /(\d+\.\d+)(?:\.\d+)?/g;
    const matches: string[] = [];
    let match;

    while ((match = versionPattern.exec(content)) !== null) {
        const version = match[0];
        if (version && !matches.includes(version)) {
            matches.push(version);
        }
    }

    return matches;
}

/**
 * Check fallback version in scripts/package.js
 */
function getPackageJsFallback(): string | null {
    const packageJsPath = path.join(PROJECT_ROOT, 'scripts', 'package.js');

    if (!fs.existsSync(packageJsPath)) {
        return null;
    }

    const content = fs.readFileSync(packageJsPath, 'utf8');
    const fallbackPattern = /packageInfo\.version\s*\|\|\s*['"](\d+\.\d+\.\d+)['"]/;
    const match = content.match(fallbackPattern);

    return match ? match[1] : null;
}

/**
 * Main verification function
 */
function verifyVersions(): void {
    console.log('');
    console.log('Version Consistency Check');
    console.log('========================');
    console.log('');

    let hasErrors = false;
    const versions: Versions = {};

    // Check package.json
    try {
        versions.packageJson = getPackageJsonVersion();
        log.info(`package.json version: ${versions.packageJson}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to read package.json: ${errorMessage}`);
        hasErrors = true;
    }

    // Check package/INFO
    try {
        versions.info = getInfoVersion();
        log.info(`package/INFO version: ${versions.info}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to read package/INFO: ${errorMessage}`);
        hasErrors = true;
    }

    // Check CHANGELOG.md
    try {
        versions.changelog = getChangelogVersion();
        if (versions.changelog) {
            log.info(`CHANGELOG.md latest version: ${versions.changelog}`);
        } else {
            log.warning('No version found in CHANGELOG.md');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to read CHANGELOG.md: ${errorMessage}`);
    }

    // Check build/INFO if exists
    try {
        versions.build = checkBuildVersion();
        if (versions.build) {
            log.info(`dist/build/INFO version: ${versions.build}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to read dist/build/INFO: ${errorMessage}`);
    }

    // Check repo/packages.json
    try {
        versions.repoPackages = getRepoPackagesVersion();
        if (versions.repoPackages) {
            log.info(`repo/packages.json version: ${versions.repoPackages}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to read repo/packages.json: ${errorMessage}`);
    }

    // Check README.md examples
    try {
        versions.readmeExamples = getReadmeVersionExamples();
        if (versions.readmeExamples.length > 0) {
            const uniqueVersions = [...new Set(versions.readmeExamples)];
            log.info(`README.md version examples: ${uniqueVersions.join(', ')}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to check README.md: ${errorMessage}`);
    }

    // Check CHANGELOG URLs
    try {
        versions.changelogUrls = getChangelogUrls();
        if (versions.changelogUrls.length > 0) {
            const uniqueUrls = [...new Set(versions.changelogUrls)];
            log.info(`CHANGELOG.md URL versions: ${uniqueUrls.join(', ')}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to check CHANGELOG URLs: ${errorMessage}`);
    }

    // Check UPGRADING.md versions
    try {
        versions.upgradingVersions = getUpgradingVersions();
        if (versions.upgradingVersions.length > 0) {
            log.info(`UPGRADING.md versions: ${versions.upgradingVersions.join(', ')}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to check UPGRADING.md: ${errorMessage}`);
    }

    // Check SECURITY.md versions
    try {
        versions.securityVersions = getSecurityVersions();
        if (versions.securityVersions.length > 0) {
            log.info(`SECURITY.md versions: ${versions.securityVersions.join(', ')}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to check SECURITY.md: ${errorMessage}`);
    }

    // Check scripts/package.js fallback version
    try {
        versions.packageJsFallback = getPackageJsFallback();
        if (versions.packageJsFallback) {
            log.info(`scripts/package.js fallback: ${versions.packageJsFallback}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warning(`Failed to check scripts/package.js: ${errorMessage}`);
    }

    console.log('');
    console.log('Verification Results:');
    console.log('--------------------');

    // Compare versions
    if (versions.packageJson && versions.info) {
        if (versions.packageJson === versions.info) {
            log.success(`package.json and package/INFO versions match (${versions.packageJson})`);
        } else {
            log.error(`Version mismatch between package.json (${versions.packageJson}) and package/INFO (${versions.info})`);
            hasErrors = true;
        }
    }

    // Check CHANGELOG version
    if (versions.changelog && versions.packageJson) {
        if (versions.changelog === versions.packageJson) {
            log.success(`CHANGELOG.md matches current version (${versions.changelog})`);
        } else {
            // Check if CHANGELOG has a newer version (might be preparing a release)
            const changelogParts = versions.changelog.split('.').map(Number);
            const packageParts = versions.packageJson.split('.').map(Number);

            let isNewer = false;
            for (let i = 0; i < 3; i++) {
                if (changelogParts[i] > packageParts[i]) {
                    isNewer = true;
                    break;
                } else if (changelogParts[i] < packageParts[i]) {
                    break;
                }
            }

            if (isNewer) {
                log.warning(`CHANGELOG.md has newer version (${versions.changelog}) than package.json (${versions.packageJson})`);
                log.warning('This might be intentional if preparing a release');
            } else {
                log.error(`CHANGELOG.md version (${versions.changelog}) is behind package.json (${versions.packageJson})`);
                hasErrors = true;
            }
        }
    }

    // Check build version if exists
    if (versions.build) {
        if (versions.build === versions.packageJson) {
            log.success(`Build version matches source version (${versions.build})`);
        } else {
            log.warning(`Build version (${versions.build}) differs from source (${versions.packageJson})`);
            log.warning('Run "yarn build" to update the build');
        }
    }

    // Check repo/packages.json version
    if (versions.repoPackages && versions.packageJson) {
        if (versions.repoPackages === versions.packageJson) {
            log.success(`repo/packages.json version matches (${versions.repoPackages})`);
        } else {
            log.error(`repo/packages.json version (${versions.repoPackages}) differs from package.json (${versions.packageJson})`);
            hasErrors = true;
        }
    }

    // Check README.md versions
    if (versions.readmeExamples && versions.readmeExamples.length > 0 && versions.packageJson) {
        const outdatedReadmeVersions = versions.readmeExamples.filter(v => v !== versions.packageJson && v !== '1.1.0' && v !== '2.0.0');
        if (outdatedReadmeVersions.length > 0) {
            log.warning(`README.md contains outdated version examples: ${outdatedReadmeVersions.join(', ')}`);
            log.warning('Consider updating documentation examples');
        }
    }

    // Check CHANGELOG URL versions
    if (versions.changelogUrls && versions.changelogUrls.length > 0) {
        // These should include all versions from current and past releases
        const hasCurrentVersion = versions.packageJson && versions.changelogUrls.includes(versions.packageJson);
        if (versions.packageJson && !hasCurrentVersion && !versions.changelogUrls.includes('1.0.1')) {
            log.warning(`CHANGELOG.md URLs may be missing current version (${versions.packageJson})`);
        }
    }

    // Check UPGRADING.md versions
    if (versions.upgradingVersions && versions.upgradingVersions.length > 0) {
        const hasOldVersions = versions.upgradingVersions.some(v => v === '1.0.0' || v === '1.0.1');
        if (hasOldVersions) {
            log.success('UPGRADING.md contains migration guides for known versions');
        }
        // Check if future versions are documented
        const futureVersions = versions.upgradingVersions.filter(v => v > (versions.packageJson || '1.0.0'));
        if (futureVersions.length > 0) {
            log.info(`UPGRADING.md documents future versions: ${futureVersions.join(', ')}`);
        }
    }

    // Check SECURITY.md versions
    if (versions.securityVersions && versions.securityVersions.length > 0 && versions.packageJson) {
        const majorMinor = versions.packageJson.split('.').slice(0, 2).join('.');
        if (!versions.securityVersions.some(v => v.startsWith(majorMinor))) {
            log.warning(`SECURITY.md may need update for current version ${majorMinor}.x`);
        }
    }

    // Check scripts/package.js fallback
    if (versions.packageJsFallback && versions.packageJson) {
        if (versions.packageJsFallback !== versions.packageJson) {
            log.warning(`scripts/package.js fallback (${versions.packageJsFallback}) differs from current version (${versions.packageJson})`);
            log.warning('Consider updating the fallback version in scripts/package.js');
        } else {
            log.success(`scripts/package.js fallback matches current version`);
        }
    }

    // Check for .spk file
    if (versions.packageJson) {
        const spkFile = checkSpkVersion(versions.packageJson);
        if (spkFile) {
            log.success(`Package file exists: ${spkFile}`);
        } else {
            log.info('Package file not built yet (run "yarn build && yarn package")');
        }
    }

    // Summary
    console.log('');
    if (hasErrors) {
        log.error('Version consistency check FAILED');
        console.log('');
        console.log('To fix version mismatch:');
        console.log('1. Update package/INFO to match package.json');
        console.log('2. Run "yarn build && yarn package" to rebuild');
        console.log('');
        process.exit(1);
    } else {
        log.success('Version consistency check PASSED');

        if (!versions.build || versions.build !== versions.packageJson) {
            console.log('');
            console.log('Note: Run "yarn build && yarn package" to create/update the package');
        }
        console.log('');
    }
}

// Run verification
verifyVersions();
