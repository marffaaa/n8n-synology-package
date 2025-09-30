<div align="center">

<img src="./assets/logos/n8n/n8n-logo.svg" alt="n8n Logo" width="70%"/>

<br/>

<img src="./assets/logos/synology/synology-logo.svg" alt="Synology Logo" width="60%"/>

<br/><br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/license/mit)
[![GitHub release](https://img.shields.io/github/v/release/josedacosta/n8n-synology-package)](https://github.com/josedacosta/n8n-synology-package/releases)
[![Synology DSM](https://img.shields.io/badge/DSM-7.0%2B-blue)](https://www.synology.com)

</div>

# n8n Synology Package

n8n package for Synology DSM 7+

## Description

This project allows you to create a Synology package (.spk) to install n8n on your Synology NAS with DSM 7.0 or higher.

**n8n** is a powerful and extensible workflow automation tool that allows you to create complex automations between different applications and services.

### Architecture

This package uses **Docker Compose** with **PostgreSQL** for a robust and performant installation:
- ✅ **Docker**: Isolation, security, easy updates
- ✅ **PostgreSQL**: High-performance database (vs default SQLite)
- ✅ **Automatic backup**: Integrated backup script
- ✅ **Reverse proxy**: Nginx configuration included
- ✅ **Production-ready**: Optimized configuration

## Prerequisites

### To build the package

- Node.js 18+ (on your development machine)
- Yarn (package manager)
- macOS or Linux (for `md5` and `shasum` commands)

### To install on Synology

- Synology NAS with DSM 7.0 or higher
- **Container Manager** (Docker) installed from Package Center
- Port 5678 available
- Minimum 2GB RAM (4GB recommended)

## Project Structure

```
n8n-synology-package/
├── package/                         # Synology package files
│   ├── INFO                        # Package metadata
│   ├── docker-compose.yml          # Docker Compose + PostgreSQL configuration
│   ├── .env.example                # Configuration example
│   ├── conf/                       # Configuration
│   │   ├── privilege              # User privileges
│   │   ├── resource               # System resources
│   │   ├── n8n.sc                 # Service configuration
│   │   └── nginx-reverse-proxy.conf  # Nginx config (example)
│   ├── scripts/                    # Installation scripts
│   │   ├── installer              # Installation/uninstallation (Docker)
│   │   ├── start-stop-status      # Start/stop (Docker Compose)
│   │   └── backup.sh              # Automatic backup
│   └── ui/                         # DSM user interface
│       ├── config                 # Interface configuration
│       └── images/                # Package icons
│           ├── n8n_256.png       # 256x256 icon
│           └── n8n_72.png        # 72x72 icon
├── scripts/                        # Build scripts
│   ├── build.js                   # Prepares files for the package
│   └── package.js                 # Creates the .spk file
├── documentation/                  # Documentation
│   └── breaking-changes-dsm7.md
├── jose/                           # Personal documentation
│   └── TUTORIEL-INSTALLATION-N8N-SYNOLOGY.md
├── dist/                           # Generated files (ignored by git)
│   ├── build/                     # Temporary build folder
│   └── *.spk                      # Final package
├── INSTALLATION-DOCKER.md          # Docker installation guide
└── package.json                    # npm/yarn configuration
```

## Quick Installation

### 1. Clone the project

```bash
git clone git@github.com:josedacosta/n8n-synology-package.git
cd n8n-synology-package
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Add icons

Download the n8n icons and place them in `package/ui/images/`:

- `n8n_256.png` (256x256 pixels)
- `n8n_72.png` (72x72 pixels)

You can get the official logos from:
- https://n8n.io/press/
- https://github.com/n8n-io/n8n/blob/master/packages/editor-ui/public/favicon.ico

### 4. Build the package

```bash
yarn build
```

This command:
- Cleans previous builds
- Copies all necessary files
- Sets permissions
- Validates package structure
- Calculates checksums

### 5. Create the .spk file

```bash
yarn package
```

This command:
- Creates the `package.tgz` archive
- Generates the final `.spk` file
- Displays MD5 and SHA256 checksums
- Places the package in `dist/`

The generated file will be: `dist/n8n-1.0.0-noarch.spk`

## Installation on Synology

### Method 1: Installation via Package Repository (Recommended)

This method allows you to install and update n8n directly from Synology Package Center.

#### Step 1: Add Package Source

1. Connect to DSM
2. Open **Package Center**
3. Click on **Settings** (⚙️ icon at top right)
4. Go to **Package Sources** tab
5. Click **Add**
6. Enter the following information:
   - **Name**: `n8n Community`
   - **Location**: `https://josedacosta.github.io/n8n-synology-package/index.json`
7. Click **OK**

#### Step 2: Install n8n

1. In Package Center, search for **"n8n"**
2. You should see the **"n8n"** package with the "Community" tag
3. Click **Install**
4. Follow the installation wizard
5. Accept the required permissions

#### Prerequisites on NAS

Before installing n8n, make sure that:

1. **Container Manager is installed**:
   - Open Package Center
   - Search for "Container Manager" (or "Docker")
   - Install it

### Method 2: Manual Installation

If you prefer to install manually or to test a specific version:

1. Download the `.spk` file from [GitHub Releases](https://github.com/josedacosta/n8n-synology-package/releases/latest)
2. Connect to DSM
3. Open **Package Center**
4. Click **Manual Install** (button at top right)
5. Select the downloaded `.spk` file
6. Follow the installation wizard
7. Accept the required permissions

### First Access

Once installed, n8n will be accessible at:

```
http://YOUR_NAS_IP:5678
```

On first launch:
1. Create your administrator account
2. Configure your preferences
3. Start creating your workflows!

**⚠️ IMPORTANT**: The file `/var/packages/n8n/target/.env` contains the encryption key. **Back it up immediately!**

### Installed Architecture

The package installs:
- **n8n** (Docker container)
- **PostgreSQL 17** (database)
- **Automatic backup script**
- **Reverse proxy configuration** (in `/var/packages/n8n/package/conf/`)

📖 **Complete installation guide**: See [INSTALLATION-DOCKER.md](./INSTALLATION-DOCKER.md)

## Configuration

### Environment Variables

The file `/var/packages/n8n/target/.env` contains the configuration:

```bash
# Network
N8N_PORT=5678
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/

# Timezone
TIMEZONE=Europe/Paris

# Database
POSTGRES_PASSWORD=generated_password

# Security (AUTOMATICALLY GENERATED)
N8N_ENCRYPTION_KEY=64_character_key

# Basic authentication (optional)
N8N_BASIC_AUTH_ACTIVE=false
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=
```

### Important Files

- **Configuration**: `/var/packages/n8n/target/.env`
- **Docker Compose**: `/var/packages/n8n/target/docker-compose.yml`
- **n8n Data**: `/var/packages/n8n/target/data/`
- **PostgreSQL Database**: `/var/packages/n8n/target/db/`
- **Backups**: `/var/packages/n8n/target/backup/`
- **Backup Script**: `/var/packages/n8n/target/backup.sh`

### Customization

To customize the installation:

```bash
# Via SSH
ssh admin@YOUR_NAS_IP

# Edit configuration
sudo vi /var/packages/n8n/target/.env

# Restart n8n
sudo synopkg restart n8n
```

**Example**: Enable HTTPS and authentication:

```bash
N8N_HOST=your-nas.synology.me
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-nas.synology.me/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_PASSWORD=YourPassword123!
```

## Service Management

### Via DSM

- **Start**: Package Center → n8n → Open
- **Stop**: Package Center → n8n → Stop
- **Restart**: Stop then Start

### Via SSH

```bash
# Start n8n
sudo synopkg start n8n

# Stop n8n
sudo synopkg stop n8n

# Restart n8n
sudo synopkg restart n8n

# Check status
sudo synopkg status n8n

# View Docker logs
cd /var/packages/n8n/target
docker-compose logs -f

# n8n logs only
docker-compose logs -f n8n

# PostgreSQL logs
docker-compose logs -f postgres
```

## Update

### Update n8n via Docker

```bash
# Via SSH on NAS
cd /var/packages/n8n/target

# 1. Create a backup
bash backup.sh

# 2. Stop containers
docker-compose down

# 3. Download new images
docker-compose pull

# 4. Restart with new versions
docker-compose up -d

# 5. Check logs
docker-compose logs -f
```

### Update the package

1. Download the new `.spk` package version
2. In Package Center, select n8n
3. Click "Update manually"
4. Select the new `.spk` file

The update script automatically performs:
- ✅ Backup before update
- ✅ Download new Docker images
- ✅ Restart containers
- ✅ Verify deployment

**Note**: Data (workflows, credentials) are preserved during the update.

## Uninstallation

### Via DSM

1. Package Center → n8n
2. Click "Uninstall"
3. Confirm uninstallation

**Note**: By default, user data is **not** deleted during uninstallation.

### Complete Data Removal

If you want to also delete all n8n data:

```bash
# Via SSH
cd /var/packages/n8n/target

# Stop and remove containers + volumes
docker-compose down -v

# Remove Docker images (optional)
docker rmi n8nio/n8n postgres:17-alpine

# Remove all data
sudo rm -rf /var/packages/n8n/target
```

## Troubleshooting

### n8n won't start

1. Verify Docker is installed and active:
   ```bash
   docker --version
   docker ps
   ```

2. Check Docker logs:
   ```bash
   cd /var/packages/n8n/target
   docker-compose logs --tail=100
   ```

3. Verify port 5678 is available:
   ```bash
   sudo netstat -tuln | grep 5678
   sudo lsof -i :5678
   ```

### "Port already in use" error

Port 5678 is already in use. Options:

1. **Free the port** (find and stop the application using it)
2. **Change the port**:
   ```bash
   # Edit the .env file
   sudo vi /var/packages/n8n/target/.env

   # Change N8N_PORT=5678 to another port (e.g., 5679)
   N8N_PORT=5679

   # Restart
   cd /var/packages/n8n/target
   docker-compose down
   docker-compose up -d
   ```

### Insufficient permissions

If you encounter permission errors:

```bash
# Fix permissions
sudo chown -R 1000:1000 /var/packages/n8n/target/data
sudo chmod -R 755 /var/packages/n8n/target/data

# Restart containers
cd /var/packages/n8n/target
docker-compose restart
```

### Database error

If PostgreSQL won't start:

```bash
cd /var/packages/n8n/target

# Check logs
docker-compose logs postgres

# If corrupted, recreate database (⚠️ DATA LOSS)
docker-compose down
sudo rm -rf db/*
docker-compose up -d
```

### View logs in real-time

```bash
# All containers
cd /var/packages/n8n/target
docker-compose logs -f

# n8n only
docker-compose logs -f n8n

# PostgreSQL only
docker-compose logs -f postgres

# Container status
docker-compose ps
```

## Package Repository Configuration (For Maintainers)

If you fork this project and want to host your own package repository:

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages** of your repository
2. Under **Source**, select **GitHub Actions**
3. Save

### 2. Publish a new version

```bash
# 1. Modify version in package/INFO
vi package/INFO  # version="1.1.0"

# 2. Build and publish
yarn release  # Build + Package + Update repository

# 3. Commit and push
git add .
git commit -m "chore: release v1.1.0"
git push

# 4. Create GitHub tag
git tag v1.1.0
git push origin v1.1.0
```

### 3. Verify deployment

Wait a few minutes then visit:
```
https://YOUR_USERNAME.github.io/n8n-synology-package/repo/packages.json
```

📖 **Complete documentation**: [docs/REPOSITORY-SETUP.md](docs/REPOSITORY-SETUP.md)

## Development

### Available Scripts

```bash
# Build the package
yarn build

# Create the .spk
yarn package

# Update the repository
yarn update-repo

# Complete build (build + package + update-repo)
yarn release

# Clean generated .spk files
yarn clean
```

### Test modifications

1. Modify files in `package/`
2. Build: `yarn build`
3. Package: `yarn package`
4. Test on a development NAS

### Synology Package Structure

A `.spk` package is a tar archive containing:

- **INFO**: Metadata (name, version, description, etc.)
- **package.tgz**: Archive of package files
  - `conf/`: Configuration files
  - `scripts/`: Installation and control scripts
  - `ui/`: DSM interface and icons

### Naming Conventions

The .spk file must follow the format:
```
{package}-{version}-{arch}.spk
```

Example: `n8n-1.0.0-noarch.spk`

## Documentation

### DSM Breaking Changes

To understand breaking changes between DSM versions:

📄 [DSM 7+ Breaking Changes Documentation](docs/breaking-changes-dsm7.md)

This document explains:
- Major changes introduced by DSM 7.0
- How to migrate from DSM 6
- Best practices for compatibility
- Migration checklist

### Log Recovery and Analysis

To debug and diagnose installation or runtime issues:

📄 [Log Recovery Guide](docs/log-recovery.md)

This document explains:
- Location of all log files
- Recovery methods (SSH, File Station, SCP)
- Running complete diagnostics
- Interpreting installation and service logs
- Complete debugging checklist
- Viewing Docker Compose logs

## Resources

### n8n

- **Official website**: https://n8n.io
- **Documentation**: https://docs.n8n.io
- **GitHub**: https://github.com/n8n-io/n8n
- **Community**: https://community.n8n.io

### Synology

- **Developer Guide**: https://help.synology.com/developer-guide/
- **Package Center**: https://www.synology.com/support/developer
- **DSM Release Notes**: https://www.synology.com/releaseNote/DSM
- **Breaking Changes**: https://help.synology.com/developer-guide/breaking_changes.html

### This Project

- **Repository**: https://github.com/josedacosta/n8n-synology-package
- **Issues**: https://github.com/josedacosta/n8n-synology-package/issues

## Contribution

Contributions are welcome! To contribute:

1. **Fork** the project
2. Create a **branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Contribution Rules

- Test your modifications on a Synology NAS
- Respect the existing project structure
- Document new features
- Use clear commit messages

## Security

### Recommendations

1. **HTTPS**: Configure a reverse proxy with HTTPS to access n8n in production
2. **Firewall**: Limit access to port 5678 via DSM firewall
3. **Credentials**: n8n credentials are encrypted, but protect access to your NAS
4. **Backups**: Regularly back up `/var/packages/n8n/target/n8n_home/`
5. **Updates**: Keep n8n up to date to benefit from security patches

### HTTPS Configuration with Reverse Proxy

Example with DSM reverse proxy:

1. Open **Control Panel** → **Application Portal**
2. Create a new rule:
   - **Source**: `n8n.your-domain.com` (HTTPS, port 443)
   - **Destination**: `localhost:5678` (HTTP)
3. Configure SSL certificate
4. Access n8n via `https://n8n.your-domain.com`

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Note**: This package bundles n8n which is under the **Sustainable Use License**. Consult the [n8n license](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) for more information.

## Author

**josedacosta**

- Website: https://josedacosta.com
- GitHub: [@josedacosta](https://github.com/josedacosta)

## Acknowledgments

- The [n8n.io](https://n8n.io) team for this excellent automation tool
- The Synology community for resources and documentation
- All contributors to this project

---

**Disclaimer**: This package is not officially supported by n8n.io or Synology. Use at your own risk.

## Search Keywords

<details>
<summary>🔍 Keywords for Search Engines</summary>

`n8n synology package` `n8n synology dsm` `n8n synology nas` `n8n synology docker` `n8n synology installation` `n8n synology spk` `n8n synology dsm 7` `n8n synology container manager` `n8n synology postgresql` `n8n synology docker compose` `workflow automation synology` `synology workflow automation` `synology automation tools` `synology n8n setup` `synology n8n docker` `install n8n synology nas` `n8n package synology dsm 7` `synology n8n reverse proxy` `synology n8n https` `synology n8n backup` `synology workflow tool` `n8n synology tutorial` `n8n synology guide` `n8n synology configuration` `synology automation workflow` `synology zapier alternative` `synology make alternative` `synology integromat alternative` `synology ifttt alternative` `synology workflow builder` `synology no-code automation` `synology api automation` `synology webhook automation` `synology task automation` `synology business automation` `synology process automation` `synology integration platform` `synology workflow management` `n8n self-hosted synology` `synology self-hosted automation` `synology private automation` `n8n nas installation` `n8n diskstation` `n8n ds920+` `n8n ds923+` `n8n ds1522+` `n8n ds1621+` `n8n rs822+` `synology package center n8n` `synology community package n8n` `synology n8n postgresql database` `synology n8n sqlite to postgresql` `synology n8n migration` `synology n8n update` `synology n8n upgrade` `synology n8n docker update` `synology n8n docker compose yml` `synology n8n environment variables` `synology n8n webhook url` `synology n8n encryption key` `synology n8n basic auth` `synology n8n authentication` `synology n8n port configuration` `synology n8n ssl` `synology n8n nginx` `synology n8n reverse proxy setup` `synology n8n application portal` `synology n8n firewall` `synology n8n security` `synology n8n backup script` `synology n8n restore` `synology n8n data backup` `synology n8n workflow backup` `synology n8n credentials backup` `synology n8n automated backup` `synology n8n troubleshooting` `synology n8n logs` `synology n8n debug` `synology n8n error` `synology n8n port 5678` `synology n8n permissions` `synology n8n database error` `synology n8n container error` `synology n8n docker logs` `n8n synology github` `n8n synology repository` `n8n synology open source` `n8n synology community` `n8n synology support` `n8n synology forum` `n8n synology reddit` `build n8n synology package` `create n8n synology spk` `compile n8n synology package` `n8n synology development` `n8n synology package development` `synology spk n8n` `synology package n8n build`

</details>