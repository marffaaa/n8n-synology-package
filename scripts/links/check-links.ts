#!/usr/bin/env tsx

/**
 * Link Checker for n8n Synology Package
 * ======================================
 *
 * A TypeScript utility to verify all URLs in the project documentation are accessible.
 * Scans Markdown, JSON, and HTML files for URLs and validates their availability.
 *
 * USAGE
 * -----
 *
 * Run directly with tsx:
 *   tsx scripts/links/check-links.ts
 *
 * Or via npm/yarn script:
 *   yarn check:links
 *   npm run check:links
 *
 * OPTIONS
 * -------
 *
 * --verbose, -v     Show detailed output for each URL check
 * --timeout <ms>    Set timeout for URL checks (default: 10000ms)
 * --include <ext>   Additional file extensions to check (e.g., --include .txt)
 * --exclude <dir>   Additional directories to exclude (e.g., --exclude dist)
 * --no-colors       Disable colored output
 * --output <file>   Custom output file path (default: logs/link-check-report.txt)
 *
 * EXAMPLES
 * --------
 *
 * Basic usage:
 *   tsx scripts/links/check-links.ts
 *
 * Verbose mode with custom timeout:
 *   tsx scripts/links/check-links.ts --verbose --timeout 5000
 *
 * Check additional file types:
 *   tsx scripts/links/check-links.ts --include .txt --include .yml
 *
 * Custom output location:
 *   tsx scripts/links/check-links.ts --output reports/urls.txt
 *
 * OUTPUT
 * ------
 *
 * - Console output with colored status indicators
 * - Detailed report saved to logs/link-check-report.txt
 * - Exit code 0 if all links are valid
 * - Exit code 1 if broken links are found
 *
 * SKIP PATTERNS
 * -------------
 *
 * The following URLs are automatically skipped:
 * - localhost URLs
 * - 127.0.0.1 addresses
 * - Placeholder URLs (YOUR_NAS_IP, your-domain, etc.)
 * - Private/internal network addresses
 *
 * @author josedacosta
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { promisify } from 'util';

// Type definitions
interface CheckResult {
    url: string;
    status: number;
    ok: boolean;
    error?: string;
}

interface Stats {
    total: number;
    working: number;
    broken: number;
    skipped: number;
    brokenUrls: string[];
    workingUrls: string[];
    skippedUrls: string[];
}

interface Options {
    verbose: boolean;
    timeout: number;
    includeExtensions: string[];
    excludeDirs: string[];
    useColors: boolean;
    outputFile: string;
}

// Parse command line arguments
function parseArgs(): Options {
    const args = process.argv.slice(2);
    const options: Options = {
        verbose: false,
        timeout: 10000,
        includeExtensions: [],
        excludeDirs: [],
        useColors: true,
        outputFile: ''
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--timeout':
                options.timeout = parseInt(args[++i], 10) || 10000;
                break;
            case '--include':
                options.includeExtensions.push(args[++i]);
                break;
            case '--exclude':
                options.excludeDirs.push(args[++i]);
                break;
            case '--no-colors':
                options.useColors = false;
                break;
            case '--output':
                options.outputFile = args[++i];
                break;
        }
    }

    return options;
}

// Configuration
const options = parseArgs();
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const REPORT_FILE = options.outputFile || path.join(LOG_DIR, 'link-check-report.txt');

// ANSI color codes
const colors = {
    reset: options.useColors ? '\x1b[0m' : '',
    red: options.useColors ? '\x1b[31m' : '',
    green: options.useColors ? '\x1b[32m' : '',
    yellow: options.useColors ? '\x1b[33m' : '',
    blue: options.useColors ? '\x1b[34m' : '',
    cyan: options.useColors ? '\x1b[36m' : ''
};

// Skip patterns for URLs
const SKIP_PATTERNS: RegExp[] = [
    /localhost/i,
    /127\.0\.0\.1/,
    /192\.168\.\d+\.\d+/,
    /10\.\d+\.\d+\.\d+/,
    /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
    /YOUR_NAS_IP/i,
    /YOUR_USERNAME/i,
    /your-nas/i,
    /your-domain/i,
    /example\.com/i,
    /NAS_IP/i
];

// Default file extensions to check
const DEFAULT_EXTENSIONS = ['.md', '.json', '.html'];

// Default directories to exclude
const DEFAULT_EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Statistics tracker
const stats: Stats = {
    total: 0,
    working: 0,
    broken: 0,
    skipped: 0,
    brokenUrls: [],
    workingUrls: [],
    skippedUrls: []
};

// Initialize report content
let reportContent = '';

/**
 * Log a message to console and report
 */
function log(message: string, toReportOnly: boolean = false): void {
    if (!toReportOnly) {
        console.log(message);
    }
    reportContent += message + '\n';
}

/**
 * Check if a URL should be skipped
 */
function shouldSkipUrl(url: string): boolean {
    return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Validate a single URL
 */
async function checkUrl(url: string): Promise<CheckResult> {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;

            const requestOptions = {
                method: 'HEAD',
                timeout: options.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; n8n-synology-link-checker/1.0)',
                    'Accept': '*/*'
                }
            };

            const req = protocol.request(url, requestOptions, (res) => {
                const statusCode = res.statusCode || 0;

                // Handle redirects
                if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                    // Follow redirect
                    checkUrl(res.headers.location).then(resolve);
                    return;
                }

                resolve({
                    url,
                    status: statusCode,
                    ok: statusCode >= 200 && statusCode < 400
                });
            });

            req.on('error', (error: Error) => {
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
                    error: 'Request timeout'
                });
            });

            req.end();
        } catch (error) {
            resolve({
                url,
                status: 0,
                ok: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}

/**
 * Extract URLs from text content
 */
function extractUrls(text: string): string[] {
    // Improved regex to capture URLs more accurately
    const urlRegex = /https?:\/\/[^\s\]()<>"'{}|\\^`\[\]]+[^\s\]()<>"'{}|\\^`\[\].,;:!?]/gi;
    const matches = text.match(urlRegex) || [];

    // Clean and deduplicate URLs
    const cleanedUrls = matches.map(url => {
        // Remove trailing punctuation
        return url.replace(/[.,;:!?)]+$/, '');
    });

    return [...new Set(cleanedUrls)];
}

/**
 * Process a single file for URL checking
 */
async function checkFile(filePath: string): Promise<void> {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    if (options.verbose) {
        console.log(`${colors.cyan}Checking:${colors.reset} ${relativePath}`);
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const urls = extractUrls(content);

        if (urls.length === 0) {
            if (options.verbose) {
                console.log('  No URLs found');
            }
            return;
        }

        for (const url of urls) {
            stats.total++;

            if (shouldSkipUrl(url)) {
                if (options.verbose) {
                    console.log(`  ${colors.yellow}⊙${colors.reset} SKIP: ${url} (placeholder/local)`);
                }
                reportContent += `SKIP: ${url} in ${relativePath} (placeholder/local)\n`;
                stats.skipped++;
                stats.skippedUrls.push(`${url} (${relativePath})`);
                continue;
            }

            const result = await checkUrl(url);

            if (result.ok) {
                if (options.verbose) {
                    console.log(`  ${colors.green}✓${colors.reset} ${result.status}: ${url}`);
                }
                reportContent += `OK (${result.status}): ${url} in ${relativePath}\n`;
                stats.working++;
                stats.workingUrls.push(`${url} (${relativePath})`);
            } else {
                const errorMsg = result.error ? ` - ${result.error}` : '';
                console.log(`  ${colors.red}✗${colors.reset} ${result.status || 'ERROR'}: ${url}${errorMsg}`);
                reportContent += `BROKEN (${result.status || 'ERROR'}): ${url} in ${relativePath}${errorMsg}\n`;
                stats.broken++;
                stats.brokenUrls.push(`${url} (${relativePath})${errorMsg}`);
            }
        }
    } catch (error) {
        console.error(`${colors.red}Error reading file ${relativePath}:${colors.reset}`, error);
    }
}

/**
 * Recursively find files with specified extensions
 */
function findFiles(dir: string, extensions: string[], excludeDirs: string[]): string[] {
    const files: string[] = [];

    function walk(currentPath: string): void {
        try {
            const items = fs.readdirSync(currentPath);

            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Check if directory should be excluded
                    if (!excludeDirs.includes(item)) {
                        walk(fullPath);
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    if (extensions.includes(ext)) {
                        // Exclude package-lock.json and yarn.lock
                        if (!item.includes('package-lock.json') && !item.includes('yarn.lock')) {
                            files.push(fullPath);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`${colors.red}Error walking directory ${currentPath}:${colors.reset}`, error);
        }
    }

    walk(dir);
    return files;
}

/**
 * Generate and display summary
 */
function displaySummary(): void {
    const separator = '='.repeat(60);

    log(`\n${separator}`);
    log('SUMMARY');
    log(separator);
    log(`Total URLs found:    ${stats.total}`);
    log(`Working URLs:        ${stats.working}`);
    log(`Broken URLs:         ${stats.broken}`);
    log(`Skipped URLs:        ${stats.skipped}`);
    log('');

    if (stats.broken > 0) {
        log(`${colors.red}Broken URLs:${colors.reset}`);
        log(separator, true);
        stats.brokenUrls.forEach(url => {
            log(`  - ${url}`);
        });
        log('');
    }

    if (stats.skipped > 0 && options.verbose) {
        log(`${colors.yellow}Skipped URLs (placeholders/local):${colors.reset}`, true);
        log(separator, true);
        stats.skippedUrls.forEach(url => {
            log(`  - ${url}`, true);
        });
        log('', true);
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}  Link Checker for n8n Synology Package${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

    // Initialize report
    reportContent = `Link Check Report
Generated: ${new Date().toISOString()}
Project: n8n Synology Package
${'='.repeat(80)}\n\n`;

    // Determine file extensions to check
    const extensions = [...DEFAULT_EXTENSIONS, ...options.includeExtensions];
    const excludeDirs = [...DEFAULT_EXCLUDE_DIRS, ...options.excludeDirs];

    console.log('Scanning project for URLs...\n');
    console.log(`File extensions: ${extensions.join(', ')}`);
    console.log(`Excluded directories: ${excludeDirs.join(', ')}\n`);

    // Find all files to check
    const files = findFiles(PROJECT_ROOT, extensions, excludeDirs);

    console.log(`Found ${files.length} files to check\n`);

    // Process each file
    for (const file of files) {
        await checkFile(file);
    }

    // Display summary
    displaySummary();

    // Save report
    try {
        fs.writeFileSync(REPORT_FILE, reportContent, 'utf8');
        console.log(`${colors.blue}Report saved to:${colors.reset} ${REPORT_FILE}\n`);
    } catch (error) {
        console.error(`${colors.red}Error saving report:${colors.reset}`, error);
    }

    // Exit with appropriate code
    if (stats.broken > 0) {
        console.log(`${colors.red}✗ Link check failed: ${stats.broken} broken URL(s) found${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}✓ All links are working!${colors.reset}`);
        process.exit(0);
    }
}

// Error handler
process.on('unhandledRejection', (error: Error) => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

// Run the link checker
main().catch((error: Error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});