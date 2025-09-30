#!/usr/bin/env bash

#############################################################################
# Clean .gitkeep files from non-empty directories
#
# This script recursively searches for .gitkeep files and removes them
# if their parent directory contains other files (is not empty).
#
# .gitkeep files are used to keep empty directories in git, but become
# unnecessary once the directory contains actual files.
#
# Usage:
#   ./scripts/git/clean-gitkeep.sh
#   ./scripts/git/clean-gitkeep.sh --dry-run  # Preview only
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
DRY_RUN=false

# Parse arguments
if [[ $# -gt 0 ]] && [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
fi

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Clean .gitkeep Files from Non-Empty Directories${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

if [[ "${DRY_RUN}" == "true" ]]; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be deleted${NC}"
    echo ""
fi

echo -e "${YELLOW}Scanning project: ${PROJECT_ROOT}${NC}"
echo ""

# Counters
total_gitkeep=0
removed_gitkeep=0
kept_gitkeep=0

# Find all .gitkeep files
while IFS= read -r -d '' gitkeep_file; do
    ((total_gitkeep++))

    # Get the directory containing the .gitkeep file
    dir=$(dirname "${gitkeep_file}")
    relative_path="${gitkeep_file#$PROJECT_ROOT/}"

    # Count files in the directory (excluding .gitkeep itself)
    file_count=$(find "${dir}" -maxdepth 1 -type f ! -name '.gitkeep' | wc -l | tr -d ' ')

    # Count subdirectories
    subdir_count=$(find "${dir}" -maxdepth 1 -type d ! -path "${dir}" | wc -l | tr -d ' ')

    # Total items (files + subdirectories)
    total_items=$((file_count + subdir_count))

    if [[ ${total_items} -gt 0 ]]; then
        # Directory is not empty - remove .gitkeep
        if [[ "${DRY_RUN}" == "true" ]]; then
            echo -e "${YELLOW}Would remove:${NC} ${relative_path}"
            echo -e "  └─ Directory has ${file_count} file(s) and ${subdir_count} subdirectory(ies)"
        else
            rm -f "${gitkeep_file}"
            echo -e "${GREEN}✓ Removed:${NC} ${relative_path}"
            echo -e "  └─ Directory has ${file_count} file(s) and ${subdir_count} subdirectory(ies)"
        fi
        ((removed_gitkeep++))
    else
        # Directory is empty - keep .gitkeep
        echo -e "${BLUE}⊙ Keeping:${NC} ${relative_path}"
        echo -e "  └─ Directory is empty (needed to track in git)"
        ((kept_gitkeep++))
    fi
    echo ""

done < <(find "${PROJECT_ROOT}" -type f -name '.gitkeep' -print0 | sort -z)

# Print summary
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

if [[ "${DRY_RUN}" == "true" ]]; then
    echo -e "${YELLOW}.gitkeep files found:${NC}      ${total_gitkeep}"
    echo -e "${YELLOW}Would be removed:${NC}          ${removed_gitkeep}"
    echo -e "${YELLOW}Would be kept:${NC}             ${kept_gitkeep}"
    echo ""
    echo -e "${YELLOW}Run without --dry-run to actually delete files${NC}"
else
    echo -e "${GREEN}.gitkeep files found:${NC}      ${total_gitkeep}"
    echo -e "${GREEN}Removed:${NC}                   ${removed_gitkeep}"
    echo -e "${BLUE}Kept (empty dirs):${NC}         ${kept_gitkeep}"
    echo ""

    if [[ ${removed_gitkeep} -gt 0 ]]; then
        echo -e "${GREEN}✓ Cleanup completed successfully!${NC}"
    else
        echo -e "${BLUE}⊙ No .gitkeep files needed removal${NC}"
    fi
fi

echo ""

# Show git status if files were removed
if [[ "${DRY_RUN}" == "false" ]] && [[ ${removed_gitkeep} -gt 0 ]]; then
    echo -e "${BLUE}Git status:${NC}"
    cd "${PROJECT_ROOT}"
    git status --short | grep '.gitkeep' || echo "  (no changes)"
    echo ""
fi