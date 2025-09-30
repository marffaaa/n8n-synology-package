# Asset Management Scripts

This directory contains scripts to manage logo and image assets for the n8n Synology Package project.

## Scripts

### 1. `generate-png-from-svg.sh`

Converts all SVG files in `assets/logos/` to PNG format in multiple resolutions.

**Generated resolutions:**
- 1024x1024px (HD)
- 512x512px (High quality)
- 256x256px (Medium quality, used for Synology package)
- 128x128px (Small)
- 64x64px (Icon size)
- 32x32px (Favicon)
- 16x16px (Tiny favicon)

**Requirements:**
- ImageMagick (`magick` command)
  - macOS: `brew install imagemagick`
  - Ubuntu: `sudo apt-get install imagemagick`
  - Fedora: `sudo dnf install imagemagick`

**Usage:**
```bash
# Generate all PNG resolutions from SVG files
./scripts/assets/generate-png-from-svg.sh
```

**Features:**
- ✅ Processes all SVG files in `assets/logos/`
- ✅ Creates PNG files alongside source SVG files
- ✅ Skips existing PNG files (no overwrite)
- ✅ Shows progress and file sizes
- ✅ Provides summary with statistics

**Output naming:**
- Input: `assets/logos/n8n/n8n-logo.svg`
- Output: `assets/logos/n8n/n8n-logo-1024.png`, `n8n-logo-512.png`, etc.

**Example output:**
```
============================================================
  PNG Icon Generator from SVG
============================================================

Processing: n8n/n8n-logo.svg
  ✓ 1024x1024 (48K)
  ✓ 512x512 (24K)
  ✓ 256x256 (12K)
  ✓ 128x128 (4.0K)
  ✓ 64x64 (4.0K)
  ✓ 32x32 (4.0K)
  ✓ 16x16 (4.0K)
✓ All sizes generated successfully

============================================================
  Summary
============================================================

SVG files processed: 4
PNG files created:   28
Failed conversions:  0
```

---

### 2. `clean-generated-png.sh`

Removes all generated PNG files from `assets/logos/`, keeping only the source SVG files.

**Purpose:**
- Clean up generated PNG files before committing
- Reduce repository size (SVG files are much smaller)
- Regenerate PNGs fresh when needed

**Usage:**
```bash
# Preview what will be deleted (dry run)
./scripts/assets/clean-generated-png.sh --dry-run

# Actually delete PNG files
./scripts/assets/clean-generated-png.sh
```

**Features:**
- ✅ Dry run mode for safety (`--dry-run`)
- ✅ Shows files to be deleted with sizes
- ✅ Preserves all SVG source files
- ✅ Provides summary with freed space

**Example output:**
```
============================================================
  Clean Generated PNG Files
============================================================

DRY RUN MODE - No files will be deleted

Would delete: n8n/n8n-logo-1024.png (48K)
Would delete: n8n/n8n-logo-512.png (24K)
Would delete: n8n/n8n-logo-256.png (12K)
...

============================================================
  Summary
============================================================

PNG files found:    28
Total size:         1.2MB

Run without --dry-run to delete these files
```

---

## Workflow

### Initial Setup
1. Add SVG logos to `assets/logos/n8n/` or `assets/logos/synology/`
2. Run `./scripts/assets/generate-png-from-svg.sh` to create PNG versions
3. Use the generated PNGs in your project

### Before Committing
```bash
# Option 1: Commit only SVG files (recommended for smaller repo)
./scripts/assets/clean-generated-png.sh

# Option 2: Commit both SVG and PNG files (larger repo, no build step needed)
# Just commit as-is
```

### After Cloning
If PNG files were not committed (clean repo):
```bash
# Regenerate PNG files from SVG
./scripts/assets/generate-png-from-svg.sh
```

---

## Current Assets

**Source SVG files:**
- `assets/logos/n8n/n8n-logo.svg` - Full n8n logo with text
- `assets/logos/n8n/n8n-simple-icon.svg` - n8n icon only
- `assets/logos/synology/synology-logo.svg` - Full Synology logo with text
- `assets/logos/synology/synology-simple-icon.svg` - Synology icon only

**Generated PNG files:**
- Each SVG generates 7 PNG files (7 resolutions)
- Total: 4 SVG × 7 resolutions = 28 PNG files
- Total size: ~1.3MB

**Package icons (manually copied):**
- `package/ui/images/n8n_256.png` - Required by Synology DSM
- `package/ui/images/n8n_72.png` - Required by Synology DSM

---

## Adding New Logos

1. **Add SVG file:**
   ```bash
   cp new-logo.svg assets/logos/n8n/
   ```

2. **Generate PNG versions:**
   ```bash
   ./scripts/assets/generate-png-from-svg.sh
   ```

3. **Verify output:**
   ```bash
   ls -lh assets/logos/n8n/new-logo-*.png
   ```

4. **Update package icons if needed:**
   ```bash
   cp assets/logos/n8n/new-logo-256.png package/ui/images/n8n_256.png
   cp assets/logos/n8n/new-logo-72.png package/ui/images/n8n_72.png
   ```

---

## Tips

### Optimize PNG File Sizes
If PNG files are too large, you can optimize them with:

```bash
# Install pngquant (lossy compression)
brew install pngquant  # macOS
sudo apt-get install pngquant  # Ubuntu

# Optimize all PNG files
find assets/logos -name "*.png" -exec pngquant --force --ext .png {} \;
```

### Convert PNG to SVG
To convert PNG to SVG (for tracing):

```bash
# Install potrace
brew install potrace  # macOS

# Convert PNG to SVG
potrace -s -o output.svg input.png
```

### Batch Convert with Different Densities
If you need higher quality PNGs, modify the `-density` value in the script:

```bash
# Default is 300 DPI
magick -density 300 -background none input.svg -resize 256x256 output.png

# Higher quality (600 DPI)
magick -density 600 -background none input.svg -resize 256x256 output.png
```

---

## Troubleshooting

### Error: "magick: command not found"
Install ImageMagick:
- macOS: `brew install imagemagick`
- Ubuntu: `sudo apt-get install imagemagick`
- Fedora: `sudo dnf install imagemagick`

### PNG files are blurry
Increase the `-density` value in the script (line 58):
```bash
magick -density 600 -background none "${svg_file}" ...
```

### Script won't run: "Permission denied"
Make the script executable:
```bash
chmod +x scripts/assets/*.sh
```

### SVG colors are wrong
Some SVG files use embedded styles that ImageMagick might not render correctly. Consider:
1. Opening the SVG in Inkscape and exporting as "Plain SVG"
2. Using `rsvg-convert` instead of ImageMagick
3. Manually editing the SVG to remove complex styles

---

## License

These scripts are part of the n8n Synology Package project and follow the same license.

Logo assets belong to their respective trademark owners:
- n8n is a trademark of n8n GmbH
- Synology is a trademark of Synology Inc.