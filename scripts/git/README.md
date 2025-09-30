# Git Maintenance Scripts

This directory contains scripts to maintain the git repository and keep it clean.

## Scripts

### `clean-gitkeep.sh`

Removes `.gitkeep` files from non-empty directories.

#### Purpose

`.gitkeep` files are used to track empty directories in git (since git doesn't track empty directories by default). However, once a directory contains actual files, the `.gitkeep` file becomes unnecessary and should be removed to keep the repository clean.

This script:
- ✅ Recursively scans the entire project
- ✅ Finds all `.gitkeep` files
- ✅ Checks if the parent directory is empty
- ✅ Removes `.gitkeep` if the directory contains other files
- ✅ Keeps `.gitkeep` if the directory is still empty

#### Usage

```bash
# Preview what would be removed (recommended first)
./scripts/git/clean-gitkeep.sh --dry-run

# Actually remove .gitkeep files from non-empty directories
./scripts/git/clean-gitkeep.sh
```

#### Example Output

```
============================================================
  Clean .gitkeep Files from Non-Empty Directories
============================================================

Scanning project: /path/to/project

✓ Removed: assets/logos/.gitkeep
  └─ Directory has 4 file(s) and 2 subdirectory(ies)

⊙ Keeping: docs/empty-folder/.gitkeep
  └─ Directory is empty (needed to track in git)

============================================================
  Summary
============================================================

.gitkeep files found:      2
Removed:                   1
Kept (empty dirs):         1

✓ Cleanup completed successfully!
```

#### When to Run

Run this script:
- ✅ After adding new files to previously empty directories
- ✅ Before committing changes (as part of cleanup)
- ✅ Periodically during development
- ✅ Before creating a release

#### Safety Features

- **Dry-run mode**: Preview changes before applying them
- **Empty directory protection**: Never removes `.gitkeep` from truly empty directories
- **Detailed output**: Shows exactly what will be removed and why
- **Git status check**: Shows git status after cleanup

#### Technical Details

**What counts as "non-empty":**
- Directory contains at least one file (excluding `.gitkeep`)
- OR directory contains at least one subdirectory

**What's considered "empty":**
- Directory contains only `.gitkeep`
- No subdirectories

#### Exit Codes

- `0`: Success (files removed or nothing to do)
- `1`: Error (file not found, permission denied, etc.)

---

## Adding New Scripts

When adding new git maintenance scripts to this directory:

1. Make them executable: `chmod +x script-name.sh`
2. Add a shebang: `#!/usr/bin/env bash`
3. Include help text and `--dry-run` option
4. Use colors for better readability
5. Show a summary at the end
6. Document in this README

---

## Related Scripts

Other maintenance scripts in the project:

- `scripts/assets/generate-png-from-svg.sh` - Generate PNG icons from SVG
- `scripts/assets/clean-generated-png.sh` - Clean generated PNG files
- `scripts/build.js` - Build the Synology package
- `scripts/package.js` - Create the .spk file

---

## Contributing

When modifying these scripts:

- ✅ Test with `--dry-run` first
- ✅ Test on an empty directory
- ✅ Test on a directory with files
- ✅ Check that git status is correct after running
- ✅ Update this README if behavior changes