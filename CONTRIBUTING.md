# Contributing to n8n Synology Package

Thank you for your interest in contributing to the n8n Synology Package project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/josedacosta/n8n-synology-package/issues) to avoid duplicates.

**When filing a bug report, include:**

- **Clear title and description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs. actual behavior
- **Environment details:**
  - Synology model and DSM version
  - Docker/Container Manager version
  - n8n version
  - Package version
- **Logs:** Include relevant logs from:
  - `/tmp/n8n_install.log`
  - `/tmp/n8n_service.log`
  - Docker Compose logs
- **Screenshots** if applicable

**Use the bug report template** when creating issues.

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Check if the enhancement has already been suggested
2. Provide a clear use case and rationale
3. Describe the expected behavior
4. Consider backward compatibility

### Contributing Code

We welcome code contributions! Here's how:

1. **Fork** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Test thoroughly** on a Synology NAS
5. **Submit a pull request**

## Development Workflow

### Prerequisites

- Node.js 18+ and Yarn
- macOS or Linux (for build scripts)
- Access to a Synology NAS with DSM 7.0+ for testing
- Container Manager installed on test NAS

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/n8n-synology-package.git
cd n8n-synology-package

# Install dependencies
yarn install

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Conventions

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-backup-encryption`)
- `fix/` - Bug fixes (e.g., `fix/port-detection-error`)
- `docs/` - Documentation changes (e.g., `docs/update-installation-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/improve-logging`)
- `test/` - Test additions/changes (e.g., `test/add-installer-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Building and Testing

```bash
# Build the package structure
yarn build

# Create the .spk file
yarn package

# Complete build pipeline
yarn release

# Clean build artifacts
yarn clean
```

### Testing on Synology NAS

**Always test your changes on a real Synology NAS before submitting:**

1. Build the package: `yarn build && yarn package`
2. Transfer to NAS: `scp dist/n8n-*.spk admin@NAS_IP:/tmp/`
3. Install via Package Center → Manual Install
4. Test all affected functionality
5. Check logs for errors
6. Run diagnostic script: `sudo bash /var/packages/n8n/target/diagnose.sh`

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All build scripts run successfully
- [ ] Tested on Synology DSM 7.0+
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with `main`

### PR Requirements

1. **Title:** Use conventional commit format
   ```
   feat(installer): add automatic port detection
   fix(backup): handle spaces in directory paths
   docs: update Docker installation guide
   ```

2. **Description:** Include:
   - What changes were made and why
   - How to test the changes
   - Screenshots/examples (if applicable)
   - Related issue numbers (Fixes #123)
   - Breaking changes (if any)

3. **Labels:** Add appropriate labels (enhancement, bug, documentation, etc.)

### Review Process

- Maintainers will review your PR within a few days
- Address review feedback promptly
- Keep PR scope focused (one feature/fix per PR)
- Be patient and respectful during review

### Merging

- PRs require approval from at least one maintainer
- Use "Squash and merge" to keep history clean
- Delete feature branch after merge

## Coding Standards

### Shell Scripts (Bash)

**All package scripts must follow these conventions:**

```bash
#!/bin/bash
set -e  # Exit on error

# Logging functions
LOG_FILE="/tmp/n8n_install.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# Use double quotes for variables
docker-compose -f "${COMPOSE_FILE}" up -d

# Check command success
if [ $? -eq 0 ]; then
    log_success "Operation completed"
else
    log_error "Operation failed"
    exit 1
fi
```

**Requirements:**
- Use `set -e` for error handling
- All operations must log timestamps
- Use double quotes for variables
- Check command exit codes
- Provide clear error messages
- Follow existing script structure

### JavaScript (Build Scripts)

```javascript
// Use ES6+ features
const fs = require('fs-extra');
const path = require('path');

// Clear function names
function buildPackage() {
    // Implementation
}

// Error handling
try {
    buildPackage();
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}

// Use async/await for asynchronous operations
async function copyFiles() {
    await fs.copy(source, dest);
}
```

### Docker Compose

```yaml
# Use version 3.8+
version: '3.8'

services:
  service-name:
    # Use specific image tags (not latest in production)
    image: postgres:17-alpine

    # Clear naming
    container_name: n8n-postgres

    # Health checks for dependencies
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(installer): add pre-installation disk space check
fix(backup): correctly handle special characters in paths
docs: update troubleshooting section with PostgreSQL errors
refactor(scripts): extract logging functions to separate module
```

## Testing Guidelines

### Manual Testing Checklist

For all changes affecting package installation or runtime:

- [ ] Clean install on DSM 7.0+
- [ ] Package starts successfully
- [ ] n8n accessible at http://NAS_IP:5678
- [ ] Database connectivity works
- [ ] Stop/start/restart functions correctly
- [ ] Logs created properly
- [ ] Backup script works
- [ ] Upgrade from previous version works
- [ ] Uninstall preserves data (unless intended)
- [ ] No errors in diagnostic output

### Testing Lifecycle Scripts

Test all installer hooks:

```bash
# On NAS, simulate lifecycle
cd /var/packages/n8n/scripts

# Pre-install
sudo ./installer preinst

# Post-install
sudo ./installer postinst

# Pre-upgrade
sudo ./installer preupgrade

# Post-upgrade
sudo ./installer postupgrade

# Pre-uninstall
sudo ./installer preuninst

# Post-uninstall
sudo ./installer postuninst
```

### Testing Service Management

```bash
# Test start-stop-status script
cd /var/packages/n8n/scripts

sudo ./start-stop-status start
sudo ./start-stop-status status
sudo ./start-stop-status stop
sudo ./start-stop-status restart
```

## Documentation

### When to Update Documentation

Update documentation when you:

- Add new features
- Change configuration options
- Modify installation/upgrade process
- Fix significant bugs
- Change project structure

### Documentation Files

- **README.md** - Main user guide (installation, usage)
- **INSTALLATION-DOCKER.md** - Detailed Docker architecture
- **docs/breaking-changes-dsm7.md** - DSM compatibility notes
- **docs/log-recovery.md** - Troubleshooting and diagnostics
- **CLAUDE.md** - Developer/AI assistant guidance
- **package/INFO** - Package metadata

### Writing Style

- Use clear, concise English
- Include examples and code snippets
- Add screenshots for UI changes
- Test all documented commands
- Keep structure consistent with existing docs

## Project Structure

```
n8n-synology-package/
├── package/              # Synology package source files
│   ├── INFO             # Package metadata (version, deps)
│   ├── docker-compose.yml
│   ├── conf/            # Configuration files
│   ├── scripts/         # Installation/service scripts
│   │   ├── installer
│   │   ├── start-stop-status
│   │   ├── backup.sh
│   │   └── diagnose.sh
│   └── ui/              # DSM UI (icons, config)
├── scripts/             # Build scripts (Node.js)
│   ├── build.js
│   ├── package.js
│   └── update-repo.js
├── docs/                # Additional documentation
├── dist/                # Build output (gitignored)
└── package.json         # Node.js dependencies
```

### Files You'll Commonly Edit

- **package/scripts/installer** - Installation lifecycle
- **package/scripts/start-stop-status** - Service management
- **package/docker-compose.yml** - Container configuration
- **package/INFO** - Package metadata and version
- **scripts/build.js** - Build process
- **README.md** - User documentation

## Getting Help

Need help contributing? See [SUPPORT.md](SUPPORT.md) for ways to get assistance.

## Recognition

All contributors will be recognized in the project. Thank you for making this project better!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Open an issue or discussion on GitHub!