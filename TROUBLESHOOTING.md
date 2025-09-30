# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the n8n Synology package.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Startup Problems](#startup-problems)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Database Problems](#database-problems)
- [Network & Connectivity](#network--connectivity)
- [Update & Migration Issues](#update--migration-issues)
- [Data & Backup Problems](#data--backup-problems)
- [Advanced Debugging](#advanced-debugging)

## Quick Diagnostics

### Run the Diagnostic Script

Before troubleshooting manually, run the built-in diagnostic script:

```bash
sudo bash /var/packages/n8n/target/diagnose.sh
```

This script checks:
- Docker/Container Manager status
- Container health
- Network connectivity
- File permissions
- Disk space
- Service status
- Configuration validity

The report is saved to `/tmp/n8n_diagnostic_[timestamp].txt`

### Check Service Status

```bash
# Via Synology
sudo synopkg status n8n

# Via Docker
cd /var/packages/n8n/target
docker-compose ps
```

## Installation Issues

### Error: "Container Manager not installed"

**Problem:** Installation fails with Docker/Container Manager not found.

**Solution:**
1. Install Container Manager from Package Center
2. Ensure it's running: `sudo synoservice --status pkgctl-Docker`
3. Retry the n8n package installation

### Error: "Port 5678 already in use"

**Problem:** Another service is using port 5678.

**Solution:**

1. Find what's using the port:
```bash
sudo netstat -tulpn | grep 5678
```

2. Either:
   - Stop the conflicting service
   - Or change n8n's port in `.env` after installation:
```bash
N8N_PORT=5679  # or another free port
```

### Error: "Insufficient privileges"

**Problem:** Installation fails due to permission issues.

**Solution:**
1. Ensure you're installing as an administrator
2. Check that the package user can be created:
```bash
sudo synouser --get n8n-user
```

### Installation Hangs

**Problem:** Installation doesn't complete.

**Solution:**
1. Check installation logs:
```bash
tail -f /tmp/n8n_install.log
```

2. Check if Docker images are being pulled:
```bash
docker ps -a
docker images
```

3. Verify internet connectivity for Docker Hub access

## Startup Problems

### Container Fails to Start

**Problem:** n8n container won't start or keeps restarting.

**Common Causes & Solutions:**

1. **Database not ready:**
```bash
# Check PostgreSQL container
docker logs n8n-postgres

# Ensure it's healthy
docker inspect n8n-postgres | grep -A 5 Health
```

2. **Invalid environment variables:**
```bash
# Check .env file syntax
cat /var/packages/n8n/target/.env

# Ensure encryption key exists and is 64 characters
grep N8N_ENCRYPTION_KEY /var/packages/n8n/target/.env
```

3. **Corrupted Docker image:**
```bash
# Re-pull images
cd /var/packages/n8n/target
docker-compose pull
docker-compose up -d
```

### Error: "Failed to connect to database"

**Problem:** n8n can't connect to PostgreSQL.

**Solution:**

1. Check PostgreSQL is running:
```bash
docker ps | grep postgres
```

2. Test database connection:
```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "SELECT 1;"
```

3. Verify database credentials match in `.env`:
```bash
grep -E "POSTGRES|DB_" /var/packages/n8n/target/.env
```

4. Check PostgreSQL logs:
```bash
docker logs n8n-postgres --tail 50
```

### Service Won't Start from Package Center

**Problem:** Starting from Package Center fails.

**Solution:**

1. Check service logs:
```bash
tail -f /tmp/n8n_service.log
```

2. Try manual start:
```bash
cd /var/packages/n8n/target
docker-compose up -d
```

3. Verify docker-compose is available:
```bash
which docker-compose || docker compose version
```

## Runtime Errors

### Workflows Not Executing

**Problem:** Workflows created but won't run.

**Debugging Steps:**

1. Check n8n logs:
```bash
docker logs n8n --tail 100
```

2. Verify execution mode:
```bash
grep EXECUTIONS_MODE /var/packages/n8n/target/.env
# Should be "regular" for production
```

3. Check webhook URL configuration:
```bash
grep WEBHOOK_URL /var/packages/n8n/target/.env
```

### Error: "Encryption key invalid"

**Problem:** Cannot decrypt credentials.

**Critical:** This usually means the encryption key has changed.

**Solution:**
1. Restore original `.env` file from backup
2. Ensure `N8N_ENCRYPTION_KEY` hasn't been modified
3. If key is lost, credentials cannot be recovered

### Memory Errors

**Problem:** "JavaScript heap out of memory" or container crashes.

**Solution:**

1. Increase memory limits in `docker-compose.yml`:
```yaml
services:
  n8n:
    mem_limit: 2g  # Increase as needed
```

2. Set Node.js memory:
```bash
# In .env
NODE_OPTIONS=--max-old-space-size=2048
```

3. Restart the service

## Performance Issues

### Slow Workflow Execution

**Diagnosis:**

1. Check system resources:
```bash
# CPU and Memory
top -b -n 1 | head -20

# Disk I/O
iostat -x 1 5

# Container resources
docker stats --no-stream
```

2. Database performance:
```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "
SELECT
  count(*) as total_executions,
  pg_size_pretty(pg_database_size('n8n')) as db_size
FROM execution_entity;"
```

**Solutions:**

1. Clean old executions:
```bash
# In n8n UI: Settings → Executions → Auto-delete executions
# Or via environment:
EXECUTIONS_DATA_MAX_AGE=168  # hours
EXECUTIONS_DATA_PRUNE=true
```

2. Optimize PostgreSQL:
```bash
# Add to docker-compose.yml under postgres service
command:
  - "postgres"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "max_connections=200"
```

### High CPU Usage

**Common Causes:**
- Infinite loops in workflows
- Large data processing
- Too many concurrent executions

**Solution:**

1. Limit concurrent executions:
```bash
# In .env
N8N_CONCURRENCY_PRODUCTION_LIMIT=10
```

2. Enable execution timeout:
```bash
N8N_MAX_EXECUTION_TIME=300  # seconds
```

## Database Problems

### Database Corruption

**Symptoms:** Errors about corrupted tables or invalid data.

**Recovery Steps:**

1. Stop the service:
```bash
cd /var/packages/n8n/target
docker-compose down
```

2. Backup current database:
```bash
sudo cp -r db db_backup_$(date +%Y%m%d)
```

3. Try to repair:
```bash
docker run --rm -v $(pwd)/db:/var/lib/postgresql/data postgres:17-alpine \
  postgres --single -D /var/lib/postgresql/data n8n
```

4. If repair fails, restore from backup:
```bash
sudo bash backup.sh restore
```

### Database Full

**Problem:** "could not extend file" or "No space left on device"

**Solution:**

1. Check disk space:
```bash
df -h /var/packages/n8n/target
du -sh /var/packages/n8n/target/*
```

2. Clean old executions:
```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "
DELETE FROM execution_entity
WHERE finished < NOW() - INTERVAL '7 days';"
```

3. Vacuum database:
```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "VACUUM FULL;"
```

## Network & Connectivity

### Cannot Access Web Interface

**Checklist:**

1. Service running:
```bash
docker ps | grep n8n
```

2. Port accessible:
```bash
curl -I http://localhost:5678
```

3. Firewall rules:
```bash
sudo iptables -L -n | grep 5678
```

4. Reverse proxy (if configured):
```bash
# Check Synology reverse proxy
cat /etc/nginx/app.d/server.ReverseProxy.conf
```

### Webhook URLs Not Working

**Problem:** External services can't reach webhooks.

**Solution:**

1. Configure public URL in `.env`:
```bash
WEBHOOK_URL=https://your-public-domain.com
```

2. Ensure port forwarding is set up on router

3. Test webhook endpoint:
```bash
curl -X POST https://your-domain.com/webhook/test
```

### SSL/HTTPS Issues

**Problem:** Certificate errors or HTTPS not working.

**For Reverse Proxy Setup:**

1. Check certificate validity:
```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

2. Verify reverse proxy configuration:
```bash
nginx -t
```

3. Restart reverse proxy:
```bash
sudo synoservice --restart nginx
```

## Update & Migration Issues

### Update Fails

**Problem:** Package update fails or gets stuck.

**Solution:**

1. Check update logs:
```bash
tail -f /tmp/n8n_install.log
```

2. Manual update process:
```bash
# Backup first
sudo bash /var/packages/n8n/target/backup.sh

# Stop service
docker-compose down

# Pull new images
docker-compose pull

# Start service
docker-compose up -d
```

### Data Loss After Update

**Problem:** Workflows or settings missing after update.

**Recovery:**

1. Check if data exists:
```bash
ls -la /var/packages/n8n/target/data/
ls -la /var/packages/n8n/target/backup/
```

2. Restore from automatic pre-upgrade backup:
```bash
# Find latest backup
ls -lt /var/packages/n8n/target/backup/

# Restore
sudo bash /var/packages/n8n/target/backup.sh restore [backup-file]
```

## Data & Backup Problems

### Backup Script Fails

**Problem:** Manual or scheduled backups failing.

**Debugging:**

1. Run manually with verbose output:
```bash
bash -x /var/packages/n8n/target/backup.sh
```

2. Check disk space:
```bash
df -h /var/packages/n8n/target/backup
```

3. Verify permissions:
```bash
ls -la /var/packages/n8n/target/backup
```

### Cannot Restore from Backup

**Problem:** Restore process fails.

**Solution:**

1. Verify backup integrity:
```bash
tar -tzf backup-file.tar.gz | head
```

2. Manual restore:
```bash
# Stop service
docker-compose down

# Extract backup
tar -xzf backup-file.tar.gz -C /var/packages/n8n/target/

# Fix permissions
chown -R n8n-user:users /var/packages/n8n/target/data

# Restart
docker-compose up -d
```

## Advanced Debugging

### Enable Debug Logging

Add to `.env`:
```bash
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console
N8N_DIAGNOSTICS_ENABLED=true
```

### Container Shell Access

```bash
# n8n container
docker exec -it n8n sh

# PostgreSQL container
docker exec -it n8n-postgres bash
```

### Network Debugging

```bash
# Test container networking
docker exec n8n ping n8n-postgres

# Check network configuration
docker network inspect n8n-network
```

### Full System Reset

⚠️ **Warning:** This removes all data!

```bash
# Complete uninstall
sudo synopkg uninstall n8n

# Remove all data
sudo rm -rf /var/packages/n8n

# Clean Docker
docker system prune -a

# Reinstall package
```

## Getting Help

If these solutions don't resolve your issue:

1. Run diagnostic script and save output
2. Collect relevant logs:
```bash
docker logs n8n --tail 200 > n8n.log
docker logs n8n-postgres --tail 200 > postgres.log
cat /tmp/n8n_*.log > install.log
```

3. Open an issue on [GitHub](https://github.com/josedacosta/n8n-synology-package/issues) with:
   - Diagnostic report
   - Log files
   - DSM version
   - Package version
   - Steps to reproduce

## Useful Commands Reference

```bash
# Service management
sudo synopkg start n8n
sudo synopkg stop n8n
sudo synopkg status n8n

# Docker management
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose restart        # Restart
docker-compose logs -f        # View logs
docker-compose ps            # Check status

# File locations
/var/packages/n8n/target/     # Main directory
/tmp/n8n_install.log         # Installation log
/tmp/n8n_service.log         # Service log
```