#!/bin/bash

# Verify .gitignore rules functionality
# This script checks that files matching .gitignore patterns are not tracked in the repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GITIGNORE_FILE="$PROJECT_ROOT/.gitignore"

echo "=========================================="
echo "Git Ignore Verification Tool"
echo "=========================================="
echo ""

# Check if .gitignore exists
if [ ! -f "$GITIGNORE_FILE" ]; then
    echo -e "${RED}ERROR: .gitignore file not found at $GITIGNORE_FILE${NC}"
    exit 1
fi

echo "Project root: $PROJECT_ROOT"
echo "Git ignore file: $GITIGNORE_FILE"
echo ""

cd "$PROJECT_ROOT"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Not a git repository${NC}"
    exit 1
fi

echo "=========================================="
echo "1. Checking tracked files against .gitignore patterns"
echo "=========================================="
echo ""

# Get all tracked files
TRACKED_FILES=$(git ls-files)

# Counter for violations
VIOLATIONS=0
VIOLATION_LIST=""

# Read .gitignore patterns (excluding comments and empty lines)
while IFS= read -r pattern; do
    # Skip comments and empty lines
    [[ "$pattern" =~ ^#.*$ ]] && continue
    [[ -z "$pattern" ]] && continue

    # Skip negation patterns (starting with !)
    [[ "$pattern" =~ ^!.*$ ]] && continue

    # Check if any tracked files match this pattern
    while IFS= read -r file; do
        # Use git check-ignore to test if file matches the pattern
        if echo "$file" | git check-ignore --stdin -q 2>/dev/null; then
            echo -e "${RED}✗${NC} File '$file' is tracked but matches .gitignore pattern: $pattern"
            VIOLATIONS=$((VIOLATIONS + 1))
            VIOLATION_LIST="${VIOLATION_LIST}${file}\n"
        fi
    done <<< "$TRACKED_FILES"
done < "$GITIGNORE_FILE"

echo ""
echo "=========================================="
echo "2. Checking for untracked files that should be ignored"
echo "=========================================="
echo ""

# Check for files that git check-ignore says should be ignored
IGNORED_COUNT=0
while IFS= read -r file; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        if git check-ignore -q "$file"; then
            IGNORED_COUNT=$((IGNORED_COUNT + 1))
        fi
    fi
done <<< "$TRACKED_FILES"

echo -e "${GREEN}✓${NC} Found $IGNORED_COUNT file(s) correctly ignored by .gitignore"
echo ""

echo "=========================================="
echo "3. Summary"
echo "=========================================="
echo ""

if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✓ SUCCESS: All .gitignore rules are working correctly!${NC}"
    echo -e "${GREEN}✓ No tracked files violate .gitignore patterns${NC}"
    exit 0
else
    echo -e "${RED}✗ FAILURE: Found $VIOLATIONS violation(s)${NC}"
    echo ""
    echo "The following tracked files should be ignored:"
    echo -e "$VIOLATION_LIST"
    echo ""
    echo "To fix these violations, run:"
    echo "  git rm --cached <file>"
    echo "  git commit -m 'chore: remove files that should be ignored'"
    echo ""
    exit 1
fi