# Upgrade Guide

This guide provides detailed instructions for upgrading the n8n Synology package between versions.

## Table of Contents

- [Before You Upgrade](#before-you-upgrade)
- [Upgrade Methods](#upgrade-methods)
- [Version-Specific Migrations](#version-specific-migrations)
- [Post-Upgrade Checklist](#post-upgrade-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Breaking Changes](#breaking-changes)
- [Data Migration](#data-migration)

## Before You Upgrade

### Pre-Upgrade Checklist

- [ ] **Read the CHANGELOG** - Check [CHANGELOG.md](CHANGELOG.md) for breaking changes
- [ ] **Backup your data** - Critical for safe upgrades
- [ ] **Check disk space** - Ensure at least 2GB free space
- [ ] **Note current version** - Document your starting version
- [ ] **Test workflows** - Ensure all workflows are working before upgrade
- [ ] **Schedule maintenance** - Plan for potential downtime

### Creating a Full Backup

Always create a complete backup before upgrading:

```bash
# Automated backup (recommended)
sudo bash /var/packages/n8n/target/backup.sh

# Manual comprehensive backup
cd /var/packages/n8n/target
tar -czf /tmp/n8n-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  data/ files/ db/ .env docker-compose.yml

# Verify backup
tar -tzf /tmp/n8n-backup-*.tar.gz | head -20
```

### Important Files to Preserve

Critical files that must be preserved during upgrades:

1. **`.env`** - Contains encryption keys and passwords
2. **`data/`** - Workflows and credentials
3. **`files/`** - User uploaded files
4. **`db/`** - PostgreSQL database
5. **`backup/`** - Previous backups

## Upgrade Methods

### Method 1: Package Center (Recommended)

The safest and easiest method:

1. **Open Package Center**
2. **Check for Updates** - Updates appear automatically
3. **Click Update** - Automatic backup is created
4. **Wait for Completion** - Package restarts automatically

### Method 2: Manual Package Update

For manual SPK file updates:

1. **Download new SPK** from [Releases](https://github.com/josedacosta/n8n-synology-package/releases)

2. **Create backup**:
```bash
sudo bash /var/packages/n8n/target/backup.sh
```

3. **Install update**:
   - Open Package Center
   - Click "Manual Install"
   - Select the new SPK file
   - Follow the wizard

### Method 3: Docker Image Update

For updating only the Docker images:

```bash
# Stop the service
cd /var/packages/n8n/target
docker-compose down

# Pull latest images
docker-compose pull

# Start with new images
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs --tail 50
```

## Version-Specific Migrations

### Upgrading from 1.0.0 to 1.0.1

**Changes:**
- Added Package Center repository support
- Updated repository URLs

**Migration Steps:**
1. Standard upgrade through Package Center
2. No data migration required
3. Repository URL automatically updated

### Upgrading from 1.0.x to 1.1.x (Future)

**Planned Changes:**
- TypeScript configuration support
- Enhanced version checking

**Migration Steps:**
1. Backup existing configuration
2. Update package
3. New TypeScript tools automatically installed

### Upgrading from Pre-1.0.0 (Beta/Manual Installation)

If you have a manual Docker installation:

1. **Export workflows from old n8n**:
   - Go to Settings → Workflows
   - Export all workflows

2. **Backup old data**:
```bash
# Assuming old installation at /volume1/docker/n8n
tar -czf n8n-manual-backup.tar.gz /volume1/docker/n8n
```

3. **Install package version**:
   - Install from Package Center
   - Import workflows in new instance

4. **Migrate credentials** (if using same encryption key):
```bash
# Copy old database
cp /volume1/docker/n8n/.n8n/database.sqlite \
   /var/packages/n8n/target/data/
```

## Post-Upgrade Checklist

After upgrading, verify everything is working:

### 1. Service Health Check

```bash
# Check service status
sudo synopkg status n8n

# Verify containers running
docker ps | grep n8n

# Check logs for errors
docker-compose logs --tail 100 | grep -i error
```

### 2. Web Interface Access

- [ ] Can access web interface at `http://NAS_IP:5678`
- [ ] Can log in successfully
- [ ] UI loads without errors

### 3. Workflow Verification

- [ ] All workflows are present
- [ ] Test a simple workflow execution
- [ ] Verify webhook endpoints work
- [ ] Check credentials are accessible

### 4. Database Integrity

```bash
# Check database connection
docker exec -it n8n-postgres psql -U n8n -d n8n -c "SELECT COUNT(*) FROM workflow_entity;"

# Verify no corruption
docker exec -it n8n-postgres psql -U n8n -d n8n -c "\dt"
```

### 5. Performance Check

```bash
# Resource usage
docker stats --no-stream

# Response time
curl -o /dev/null -s -w "Response time: %{time_total}s\n" http://localhost:5678
```

## Rollback Procedures

If an upgrade fails or causes issues, follow these rollback steps:

### Automatic Rollback

The package creates an automatic backup before upgrade:

```bash
# Stop the service
sudo synopkg stop n8n

# Find pre-upgrade backup
ls -lt /var/packages/n8n/target/backup/ | grep pre-upgrade

# Restore from backup
cd /var/packages/n8n/target
sudo bash backup.sh restore backup/n8n-backup-pre-upgrade-[timestamp].tar.gz

# Restart service
sudo synopkg start n8n
```

### Manual Rollback

1. **Stop the service**:
```bash
docker-compose down
```

2. **Restore backup**:
```bash
cd /var/packages/n8n/target
tar -xzf /path/to/backup.tar.gz
```

3. **Downgrade Docker images** (if needed):
```bash
# Edit docker-compose.yml
# Change: image: n8nio/n8n:latest
# To: image: n8nio/n8n:0.236.0  # or specific version

docker-compose pull
docker-compose up -d
```

4. **Reinstall old package version**:
```bash
# Download old SPK version
# Manual install through Package Center
```

## Breaking Changes

### Known Breaking Changes

#### Version 2.0.0 (Future)
- PostgreSQL upgrade from 17 to 18
- Node.js version requirements change
- New environment variable format

#### DSM 8.0 Compatibility (Future)
- Package structure changes
- New permission system
- Container Manager updates

### Handling Breaking Changes

1. **Read documentation** before upgrading
2. **Test in non-production** environment first
3. **Prepare migration scripts** if needed
4. **Have rollback plan** ready

## Data Migration

### Migrating Between Databases

#### SQLite to PostgreSQL

If migrating from SQLite (manual installation) to PostgreSQL (package):

```bash
# Export from SQLite installation
docker exec -it [old-n8n-container] \
  n8n export:workflow --all --output=/data/workflows.json

docker exec -it [old-n8n-container] \
  n8n export:credentials --all --output=/data/credentials.json

# Import to PostgreSQL installation
docker exec -it n8n \
  n8n import:workflow --input=/home/node/.n8n/workflows.json

docker exec -it n8n \
  n8n import:credentials --input=/home/node/.n8n/credentials.json
```

#### PostgreSQL Version Upgrade

Major PostgreSQL upgrades (e.g., 17 to 18):

```bash
# Dump database
docker exec -it n8n-postgres \
  pg_dump -U n8n -d n8n > n8n_dump.sql

# Stop old version
docker-compose down

# Update docker-compose.yml to new PostgreSQL version
# Start new version
docker-compose up -d

# Restore database
docker exec -i n8n-postgres \
  psql -U n8n -d n8n < n8n_dump.sql
```

### Migrating Large Datasets

For instances with many workflows/executions:

1. **Clean old executions** before migration:
```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "
DELETE FROM execution_entity
WHERE finished < NOW() - INTERVAL '30 days';"
```

2. **Export in batches**:
```bash
# Export workflows in groups
for i in {1..10}; do
  docker exec -it n8n \
    n8n export:workflow --backup --output=/data/batch$i.json
done
```

3. **Use compression**:
```bash
# Compress large backups
tar -czf backup.tar.gz data/ --exclude='data/executions'
```

## Best Practices

### Testing Upgrades

1. **Clone your setup** on a test NAS if possible
2. **Use Docker locally** to test new versions:
```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:next
```

3. **Monitor after upgrade** for 24 hours

### Scheduling Upgrades

- **Avoid peak hours** - Schedule during low usage
- **Maintenance window** - Inform users in advance
- **Staged rollout** - Upgrade test instance first

### Documentation

Keep records of:
- Upgrade date and time
- Version changes (from → to)
- Any issues encountered
- Custom configurations modified
- Performance changes observed

## Upgrade Automation

### Automated Backup Before Upgrade

Create a scheduled task in DSM:

1. Control Panel → Task Scheduler
2. Create → Scheduled Task → User-defined script
3. Script:
```bash
#!/bin/bash
/var/packages/n8n/target/backup.sh
find /var/packages/n8n/target/backup -mtime +30 -delete
```
4. Schedule: Daily or before maintenance

### Health Check After Upgrade

Automated health check script:

```bash
#!/bin/bash
# Save as /var/packages/n8n/target/health-check.sh

# Check if service is running
if ! docker ps | grep -q n8n; then
  echo "ERROR: n8n container not running"
  exit 1
fi

# Check web interface
if ! curl -f -s http://localhost:5678/healthz > /dev/null; then
  echo "ERROR: n8n web interface not responding"
  exit 1
fi

# Check database
if ! docker exec n8n-postgres pg_isready -U n8n > /dev/null; then
  echo "ERROR: PostgreSQL not ready"
  exit 1
fi

echo "SUCCESS: All health checks passed"
```

## Troubleshooting Upgrades

Common upgrade issues and solutions:

### "Package is damaged"
- Re-download the SPK file
- Check file integrity with MD5/SHA256
- Ensure sufficient disk space

### "Failed to stop service"
```bash
# Force stop
docker-compose down -v
docker stop n8n n8n-postgres
docker rm n8n n8n-postgres
```

### "Database migration failed"
- Check PostgreSQL logs
- Restore from backup
- Manually run migrations

### "Encryption key mismatch"
- Never change encryption key during upgrade
- Restore original .env file
- Keep encryption key backed up securely

## Getting Help

If you encounter issues during upgrade:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [GitHub Issues](https://github.com/josedacosta/n8n-synology-package/issues)
3. Run diagnostic script and save output
4. Contact support with:
   - Current version
   - Target version
   - Error messages
   - Diagnostic report

---

**Remember:** Always backup before upgrading. Your workflows and data are valuable!