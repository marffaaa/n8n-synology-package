#!/usr/bin/env bash

#############################################################################
# Link Checker for n8n Synology Package Project
#
# This script checks all URLs in the project to ensure they are accessible
# and return proper HTTP status codes.
#
# Usage:
#   ./scripts/links/check-links.sh
#
# Output:
#   - List of all checked URLs with their status
#   - Summary of working and broken links
#   - Detailed report saved to logs/link-check-report.txt
#############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"
REPORT_FILE="${LOG_DIR}/link-check-report.txt"

# Create logs directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Initialize counters
total_links=0
working_links=0
broken_links=0
skipped_links=0

# Arrays to store results
declare -a broken_urls
declare -a working_urls
declare -a skipped_urls

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Link Checker for n8n Synology Package${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo "Scanning project for URLs..."
echo ""

# Initialize report file
cat > "${REPORT_FILE}" <<EOF
Link Check Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')
Project: n8n Synology Package
================================================================================

EOF

# Function to check if URL is accessible
check_url() {
    local url="$1"
    local file="$2"
    local http_code

    # Skip localhost URLs
    if [[ "$url" =~ ^https?://localhost || "$url" =~ ^https?://127\.0\.0\.1 || "$url" =~ YOUR_NAS_IP || "$url" =~ YOUR_USERNAME || "$url" =~ your-nas ]]; then
        echo -e "  ${YELLOW}⊙${NC} SKIP: $url (localhost/placeholder)"
        echo "SKIP: $url (localhost/placeholder) in $file" >> "${REPORT_FILE}"
        ((skipped_links++))
        skipped_urls+=("$url ($file)")
        return 0
    fi

    # Try to fetch HTTP status code with timeout
    http_code=$(curl -o /dev/null -s -w "%{http_code}" -L --max-time 10 "$url" 2>/dev/null || echo "000")

    # Check if URL is accessible (2xx, 3xx status codes)
    if [[ "$http_code" =~ ^[23] ]]; then
        echo -e "  ${GREEN}✓${NC} $http_code: $url"
        echo "OK ($http_code): $url in $file" >> "${REPORT_FILE}"
        ((working_links++))
        working_urls+=("$url ($file)")
        return 0
    else
        echo -e "  ${RED}✗${NC} $http_code: $url"
        echo "BROKEN ($http_code): $url in $file" >> "${REPORT_FILE}"
        ((broken_links++))
        broken_urls+=("$url ($file)")
        return 1
    fi
}

# Function to extract and check URLs from a file
check_file() {
    local file="$1"
    local relative_path="${file#$PROJECT_ROOT/}"

    echo -e "${BLUE}Checking:${NC} $relative_path"

    # Extract URLs using grep and regex
    # Matches http:// and https:// URLs
    local urls=$(grep -oE 'https?://[^][)(><"'\'' ]+' "$file" 2>/dev/null | sort -u || true)

    if [[ -z "$urls" ]]; then
        echo "  No URLs found"
        return 0
    fi

    while IFS= read -r url; do
        # Clean up URL (remove trailing punctuation)
        url=$(echo "$url" | sed 's/[,;:.)]+$//')
        ((total_links++))
        check_url "$url" "$relative_path"
    done <<< "$urls"

    echo ""
}

# Find and check all markdown files
echo -e "${YELLOW}Scanning Markdown files...${NC}"
echo ""

while IFS= read -r -d '' file; do
    check_file "$file"
done < <(find "${PROJECT_ROOT}" -type f \( -name "*.md" -o -name "*.MD" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -print0)

# Find and check all JSON files (for package repositories)
echo -e "${YELLOW}Scanning JSON files...${NC}"
echo ""

while IFS= read -r -d '' file; do
    check_file "$file"
done < <(find "${PROJECT_ROOT}" -type f -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/package-lock.json" -print0)

# Find and check HTML files
echo -e "${YELLOW}Scanning HTML files...${NC}"
echo ""

while IFS= read -r -d '' file; do
    check_file "$file"
done < <(find "${PROJECT_ROOT}" -type f -name "*.html" -not -path "*/node_modules/*" -not -path "*/.git/*" -print0)

# Print summary
cat >> "${REPORT_FILE}" <<EOF

================================================================================
SUMMARY
================================================================================
Total URLs found:    $total_links
Working URLs:        $working_links
Broken URLs:         $broken_links
Skipped URLs:        $skipped_links

EOF

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo -e "${GREEN}Total URLs found:${NC}    $total_links"
echo -e "${GREEN}Working URLs:${NC}        $working_links"
echo -e "${RED}Broken URLs:${NC}         $broken_links"
echo -e "${YELLOW}Skipped URLs:${NC}        $skipped_links"
echo ""

# Print broken URLs if any
if [[ ${broken_links} -gt 0 ]]; then
    echo -e "${RED}Broken URLs:${NC}" | tee -a "${REPORT_FILE}"
    echo "=================================================================================" >> "${REPORT_FILE}"
    for url in "${broken_urls[@]}"; do
        echo "  - $url" | tee -a "${REPORT_FILE}"
    done
    echo ""
fi

# Print skipped URLs
if [[ ${skipped_links} -gt 0 ]]; then
    echo -e "${YELLOW}Skipped URLs (localhost/placeholders):${NC}" >> "${REPORT_FILE}"
    echo "=================================================================================" >> "${REPORT_FILE}"
    for url in "${skipped_urls[@]}"; do
        echo "  - $url" >> "${REPORT_FILE}"
    done
    echo "" >> "${REPORT_FILE}"
fi

echo -e "${BLUE}Report saved to:${NC} $REPORT_FILE"
echo ""

# Exit with error if there are broken links
if [[ ${broken_links} -gt 0 ]]; then
    echo -e "${RED}✗ Link check failed: ${broken_links} broken URL(s) found${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All links are working!${NC}"
    exit 0
fi