#!/usr/bin/env bash

#############################################################################
# Generate PNG icons from SVG files in multiple resolutions
#
# This script converts all SVG files in assets/logos/ to PNG format
# in the following resolutions: 1024, 512, 256, 128, 64, 32, 16
#
# Requirements:
#   - ImageMagick (magick command)
#
# Usage:
#   ./scripts/assets/generate-png-from-svg.sh
#
# Output:
#   PNG files are created alongside their source SVG files
#   with naming pattern: <name>-<size>.png
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
SIZES=(1024 512 256 128 64 32 16)

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo -e "${RED}✗ Error: ImageMagick (magick) is not installed${NC}"
    echo ""
    echo "Please install ImageMagick:"
    echo "  - macOS:   brew install imagemagick"
    echo "  - Ubuntu:  sudo apt-get install imagemagick"
    echo "  - Fedora:  sudo dnf install imagemagick"
    echo ""
    exit 1
fi

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  PNG Icon Generator from SVG${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Counter for statistics
total_svgs=0
total_pngs=0
failed=0

# Function to generate PNG from SVG
generate_png() {
    local svg_file="$1"
    local size="$2"
    local base_name="$(basename "${svg_file}" .svg)"
    local dir_name="$(dirname "${svg_file}")"
    local output_file="${dir_name}/${base_name}-${size}.png"

    # Skip if output file already exists
    if [[ -f "${output_file}" ]]; then
        echo -e "  ${YELLOW}⊙${NC} ${size}x${size} (exists)"
        return 0
    fi

    # Generate PNG with ImageMagick
    if magick -density 300 -background none "${svg_file}" \
             -resize "${size}x${size}" "${output_file}" 2>/dev/null; then
        local file_size=$(du -h "${output_file}" | cut -f1)
        echo -e "  ${GREEN}✓${NC} ${size}x${size} (${file_size})"
        return 0
    else
        echo -e "  ${RED}✗${NC} ${size}x${size} (failed)"
        return 1
    fi
}

# Process all SVG files
echo -e "${YELLOW}Searching for SVG files in ${LOGOS_DIR}...${NC}"
echo ""

while IFS= read -r -d '' svg_file; do
    relative_path="${svg_file#$LOGOS_DIR/}"
    echo -e "${BLUE}Processing:${NC} ${relative_path}"

    ((total_svgs++))
    svg_failed=0

    for size in "${SIZES[@]}"; do
        if generate_png "${svg_file}" "${size}"; then
            ((total_pngs++))
        else
            ((failed++))
            svg_failed=1
        fi
    done

    if [[ ${svg_failed} -eq 0 ]]; then
        echo -e "${GREEN}✓ All sizes generated successfully${NC}"
    fi
    echo ""

done < <(find "${LOGOS_DIR}" -type f -name "*.svg" -print0 | sort -z)

# Print summary
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo -e "${GREEN}SVG files processed:${NC} ${total_svgs}"
echo -e "${GREEN}PNG files created:${NC}   ${total_pngs}"

if [[ ${failed} -gt 0 ]]; then
    echo -e "${RED}Failed conversions:${NC}  ${failed}"
    echo ""
    exit 1
else
    echo -e "${GREEN}Failed conversions:${NC}  0"
    echo ""
    echo -e "${GREEN}✓ All conversions completed successfully!${NC}"
    echo ""
fi

# Show directory sizes
echo -e "${BLUE}Directory sizes:${NC}"
du -sh "${LOGOS_DIR}"/*/. 2>/dev/null | while read -r size dir; do
    dir_name="$(basename "${dir%/.}")"
    echo -e "  ${dir_name}: ${size}"
done
echo ""

echo -e "${YELLOW}Note:${NC} Existing PNG files were skipped. To regenerate, delete them first."
echo ""