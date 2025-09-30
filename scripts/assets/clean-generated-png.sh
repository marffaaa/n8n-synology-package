#!/usr/bin/env bash

#############################################################################
# Clean generated PNG files from assets/logos/
#
# This script removes all PNG files that were generated from SVG sources
# by the generate-png-from-svg.sh script. SVG files are kept intact.
#
# Usage:
#   ./scripts/assets/clean-generated-png.sh
#   ./scripts/assets/clean-generated-png.sh --dry-run  # Preview only
#
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
LOGOS_DIR="${PROJECT_ROOT}/assets/logos"
DRY_RUN=false

# Parse arguments
if [[ $# -gt 0 ]] && [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
fi

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Clean Generated PNG Files${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

if [[ "${DRY_RUN}" == "true" ]]; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be deleted${NC}"
    echo ""
fi

# Counter for statistics
total_deleted=0
total_size=0

echo -e "${YELLOW}Searching for PNG files in ${LOGOS_DIR}...${NC}"
echo ""

# Find and process all PNG files
while IFS= read -r -d '' png_file; do
    relative_path="${png_file#$LOGOS_DIR/}"
    file_size=$(stat -f%z "${png_file}" 2>/dev/null || stat -c%s "${png_file}" 2>/dev/null || echo "0")
    ((total_size+=file_size))

    if [[ "${DRY_RUN}" == "true" ]]; then
        human_size=$(du -h "${png_file}" | cut -f1)
        echo -e "${YELLOW}Would delete:${NC} ${relative_path} (${human_size})"
    else
        human_size=$(du -h "${png_file}" | cut -f1)
        rm -f "${png_file}"
        echo -e "${GREEN}✓ Deleted:${NC} ${relative_path} (${human_size})"
    fi

    ((total_deleted++))

done < <(find "${LOGOS_DIR}" -type f -name "*.png" -print0 | sort -z)

# Convert total size to human readable
if [[ ${total_size} -gt 1048576 ]]; then
    human_total_size="$((total_size / 1048576))MB"
elif [[ ${total_size} -gt 1024 ]]; then
    human_total_size="$((total_size / 1024))KB"
else
    human_total_size="${total_size}B"
fi

# Print summary
echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

if [[ "${DRY_RUN}" == "true" ]]; then
    echo -e "${YELLOW}PNG files found:${NC}    ${total_deleted}"
    echo -e "${YELLOW}Total size:${NC}         ${human_total_size}"
    echo ""
    echo -e "${YELLOW}Run without --dry-run to delete these files${NC}"
else
    echo -e "${GREEN}PNG files deleted:${NC}  ${total_deleted}"
    echo -e "${GREEN}Space freed:${NC}        ${human_total_size}"
    echo ""

    if [[ ${total_deleted} -gt 0 ]]; then
        echo -e "${GREEN}✓ Cleanup completed successfully!${NC}"
    else
        echo -e "${YELLOW}⊙ No PNG files found to delete${NC}"
    fi
fi

echo ""
echo -e "${BLUE}SVG files preserved:${NC}"
find "${LOGOS_DIR}" -type f -name "*.svg" -print0 | xargs -0 ls -lh | awk '{print "  " $9}'
echo ""