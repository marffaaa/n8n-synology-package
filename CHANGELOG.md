# Changelog

All notable changes to the n8n Synology Package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-09-29

### Added
- **Synology Package Center Repository**: Users can now add the package repository to Package Center for direct installation
- GitHub Pages site with repository information and setup instructions
- Automated repository index updates on new releases
- Comprehensive repository setup documentation (ADD-REPOSITORY.md)

### Changed
- Updated README with correct repository URL
- Improved release workflow to auto-update repository index

### Fixed
- Corrected repository URL in documentation from `/repo/` to `/index.json`

## [1.0.0] - 2025-09-29

### Added
- Initial release for Synology DSM 7+
- Docker Compose-based installation with PostgreSQL 17
- Automated backup system with rotation
- Comprehensive logging throughout lifecycle hooks
- Diagnostic script for troubleshooting
- Support for reverse proxy configuration (HTTPS)
- Automated GitHub Actions release workflow

### Features
- **PostgreSQL Backend**: Uses PostgreSQL 17 instead of SQLite for production-ready deployment
- **Docker Isolation**: Runs in Docker containers for better security and easier updates
- **Automated Backups**: Scheduled backups with configurable retention
- **Health Checks**: Container health monitoring and automatic recovery
- **Secure Credentials**: Auto-generated encryption keys and database passwords
- **DSM Integration**: Native Package Center integration with start/stop controls

### Requirements
- Synology DSM 7.0 or higher
- Container Manager (Docker) installed
- Minimum 2GB RAM (4GB recommended)
- Port 5678 available

### Documentation
- Comprehensive README with installation instructions
- Docker architecture documentation (INSTALLATION-DOCKER.md)
- DSM 7 breaking changes guide
- Log retrieval and troubleshooting guide
- Example reverse proxy configuration for HTTPS

[1.0.1]: https://github.com/josedacosta/n8n-synology-package/releases/tag/v1.0.1
[1.0.0]: https://github.com/josedacosta/n8n-synology-package/releases/tag/v1.0.0