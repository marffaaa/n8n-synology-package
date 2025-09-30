# Frequently Asked Questions (FAQ)

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Updates & Maintenance](#updates--maintenance)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Installation

### Q: What are the minimum requirements for installing the n8n Synology package?

**A:** The minimum requirements are:
- Synology DSM 7.0 or higher
- Container Manager (Docker) installed from Package Center
- Minimum 2GB RAM (4GB recommended for production use)
- Port 5678 available (can be changed during installation)
- At least 2GB of free disk space

### Q: Can I install this package on DSM 6.x?

**A:** No, this package is designed specifically for DSM 7.0 and later. DSM 7 introduced significant changes to the package system that are incompatible with DSM 6. For DSM 6, you would need to manually install n8n using Docker.

### Q: How do I add the repository to Package Center?

**A:** Follow these steps:
1. Open Package Center
2. Click Settings → Package Sources tab
3. Click Add
4. Enter:
   - Name: `n8n Synology Package`
   - Location: `https://josedacosta.github.io/n8n-synology-package/index.json`
5. Click OK

### Q: Why does the installation fail with "Docker not found"?

**A:** You need to install Container Manager (formerly Docker) from the Synology Package Center first. The n8n package requires Docker to run the containers.

## Configuration

### Q: How can I change the default port (5678)?

**A:** You can modify the port in the `.env` file:
1. SSH into your NAS
2. Navigate to `/var/packages/n8n/target/`
3. Edit the `.env` file and change `N8N_PORT=5678` to your desired port
4. Restart the package from Package Center

### Q: How do I enable HTTPS/SSL?

**A:** There are two methods:

**Method 1: Using Synology's Reverse Proxy (Recommended)**
1. Go to Control Panel → Login Portal → Advanced → Reverse Proxy
2. Create a new rule with your domain pointing to `localhost:5678`
3. Enable HTTPS in the reverse proxy settings

**Method 2: Using the provided nginx configuration**
1. Copy `/var/packages/n8n/target/nginx-reverse-proxy.conf`
2. Customize it with your domain and certificates
3. Apply it to your web server configuration

### Q: Where are my workflows stored?

**A:** All n8n data is stored in:
- Workflows & Credentials: `/var/packages/n8n/target/data/`
- Uploaded files: `/var/packages/n8n/target/files/`
- PostgreSQL database: `/var/packages/n8n/target/db/`
- Backups: `/var/packages/n8n/target/backup/`

### Q: How do I enable basic authentication?

**A:** Edit the `.env` file and set:
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_username
N8N_BASIC_AUTH_PASSWORD=your_password
```
Then restart the package.

## Usage

### Q: How do I access n8n after installation?

**A:** Open your web browser and navigate to:
- Local access: `http://YOUR_NAS_IP:5678`
- If using reverse proxy: `https://your-domain.com`

### Q: Can I run multiple instances of n8n?

**A:** The package only supports one instance. For multiple instances, you would need to manually set up additional Docker containers with different ports and data directories.

### Q: How do I connect n8n to external services?

**A:** n8n can connect to any service accessible from your NAS:
- For local services: Use the NAS IP address or container names
- For external services: Ensure your NAS has internet access
- For webhook URLs: Configure `WEBHOOK_URL` in the `.env` file with your public URL

### Q: What's the default database used?

**A:** The package uses PostgreSQL 17 (Alpine version) for better performance and reliability compared to the default SQLite. The database runs in a separate container and is automatically configured during installation.

## Updates & Maintenance

### Q: How do I update the n8n package?

**A:** Updates can be done through Package Center:
1. Package Center will notify you when updates are available
2. Click "Update" - the package will automatically backup before updating
3. Your workflows and settings are preserved during updates

### Q: Will updating delete my workflows?

**A:** No, all your data is preserved during updates. The package automatically creates a backup before any upgrade as a safety measure.

### Q: How do I manually backup my data?

**A:** You can:
1. Use the built-in backup script: `sudo bash /var/packages/n8n/target/backup.sh`
2. Manually copy the `/var/packages/n8n/target/data/` directory
3. Set up scheduled backups using Task Scheduler

### Q: How often should I update?

**A:** We recommend:
- Security updates: Install immediately
- Feature updates: Test in a non-production environment first
- Check the [CHANGELOG.md](CHANGELOG.md) for breaking changes before updating

## Troubleshooting

### Q: n8n won't start after installation. What should I check?

**A:** Run the diagnostic script:
```bash
sudo bash /var/packages/n8n/target/diagnose.sh
```
This will check common issues and generate a report.

### Q: I lost my encryption key. Can I recover my credentials?

**A:** Unfortunately, no. The encryption key (`N8N_ENCRYPTION_KEY`) is required to decrypt stored credentials. Without it, encrypted credentials cannot be recovered. Always backup your `.env` file!

### Q: Container keeps restarting. How do I debug?

**A:** Check the logs:
```bash
cd /var/packages/n8n/target
docker-compose logs -f
```
Common issues include:
- Port conflicts
- Database connection issues
- Insufficient memory

### Q: How do I completely uninstall and start fresh?

**A:**
1. Uninstall from Package Center
2. To remove all data (⚠️ This deletes everything!):
```bash
sudo rm -rf /var/packages/n8n
```
3. Reinstall the package

## Security

### Q: Is my data encrypted?

**A:**
- Credentials in n8n are encrypted using the `N8N_ENCRYPTION_KEY`
- Database connections use passwords (auto-generated during installation)
- File system encryption depends on your NAS configuration

### Q: How do I secure my n8n instance?

**A:** Best practices:
1. Enable HTTPS using reverse proxy
2. Use strong passwords for basic authentication
3. Regularly backup your encryption key (`.env` file)
4. Keep the package updated
5. Restrict network access using firewall rules
6. Enable 2FA on your Synology account

### Q: Can I change the encryption key?

**A:** No, changing the encryption key after initial setup will make existing credentials inaccessible. The key is generated during installation and must remain the same.

### Q: Is it safe to expose n8n to the internet?

**A:** Yes, but with precautions:
- Always use HTTPS
- Enable authentication (basic auth or SSO)
- Use a reverse proxy
- Keep n8n updated
- Monitor access logs
- Consider VPN access for sensitive deployments

## Advanced

### Q: Can I customize the Docker Compose configuration?

**A:** Yes, but be careful:
1. Edit `/var/packages/n8n/target/docker-compose.yml`
2. Restart the package
3. Note: Changes may be overwritten during updates

### Q: How do I add environment variables?

**A:** Add them to the `.env` file in `/var/packages/n8n/target/`. See [n8n documentation](https://docs.n8n.io/reference/environment-variables/) for available options.

### Q: Can I use an external PostgreSQL database?

**A:** Yes, modify the database environment variables in `.env`:
```bash
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=your-external-host
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your-password
```

### Q: How do I enable execution debugging?

**A:** Set in `.env`:
```bash
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console
```
Then check logs with `docker-compose logs -f n8n`

---

## Still have questions?

- Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed problem-solving
- Review the [README.md](README.md) for installation instructions
- Visit [n8n documentation](https://docs.n8n.io)
- Open an issue on [GitHub](https://github.com/josedacosta/n8n-synology-package/issues)