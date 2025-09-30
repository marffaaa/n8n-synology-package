#!/bin/bash

# =============================================================================
# n8n backup script for Synology DSM
# =============================================================================
# This script automatically backs up:
# - n8n data (workflows, credentials)
# - PostgreSQL database
# - Docker Compose configuration
# =============================================================================

# Configuration
BACKUP_DIR="/var/packages/n8n/target/backup"
DATE=$(date +%Y%m%d_%H%M%S)
N8N_DATA="/var/packages/n8n/target/data"
RETENTION_DAYS=30

# Colors for logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting n8n backup..."
log_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"

# =============================================================================
# 1. Back up n8n data
# =============================================================================
log_info "Backing up n8n data..."

if [ -d "$N8N_DATA" ]; then
    tar -czf "$BACKUP_DIR/n8n-data-$DATE.tar.gz" -C "$(dirname $N8N_DATA)" "$(basename $N8N_DATA)" 2>&1

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_DIR/n8n-data-$DATE.tar.gz" | cut -f1)
        log_success "n8n data backed up ($SIZE)"
    else
        log_error "Failed to back up n8n data"
        exit 1
    fi
else
    log_warning "n8n data directory not found: $N8N_DATA"
fi

# =============================================================================
# 2. Back up PostgreSQL database (if used)
# =============================================================================
if docker ps --format '{{.Names}}' | grep -q "n8n-postgres"; then
    log_info "Backing up PostgreSQL database..."

    docker exec n8n-postgres pg_dump -U n8n -d n8n 2>/dev/null | gzip > "$BACKUP_DIR/n8n-db-$DATE.sql.gz"

    if [ $? -eq 0 ] && [ -f "$BACKUP_DIR/n8n-db-$DATE.sql.gz" ]; then
        SIZE=$(du -h "$BACKUP_DIR/n8n-db-$DATE.sql.gz" | cut -f1)
        log_success "PostgreSQL database backed up ($SIZE)"
    else
        log_error "Failed to back up PostgreSQL"
    fi
else
    log_info "PostgreSQL not in use, backup skipped"
fi

# =============================================================================
# 3. Back up Docker Compose configuration
# =============================================================================
COMPOSE_FILE="/var/packages/n8n/target/docker-compose.yml"

if [ -f "$COMPOSE_FILE" ]; then
    log_info "Backing up Docker Compose configuration..."
    cp "$COMPOSE_FILE" "$BACKUP_DIR/docker-compose-$DATE.yml"

    if [ $? -eq 0 ]; then
        log_success "Docker Compose configuration backed up"
    else
        log_warning "Failed to back up docker-compose.yml"
    fi
else
    log_warning "docker-compose.yml file not found"
fi

# =============================================================================
# 4. Back up .env file (if present)
# =============================================================================
ENV_FILE="/var/packages/n8n/target/.env"

if [ -f "$ENV_FILE" ]; then
    log_info "Backing up .env file..."
    cp "$ENV_FILE" "$BACKUP_DIR/env-$DATE"

    if [ $? -eq 0 ]; then
        log_success ".env file backed up"
    else
        log_warning "Failed to back up .env"
    fi
fi

# =============================================================================
# 5. Clean up old backups (> RETENTION_DAYS days)
# =============================================================================
log_info "Cleaning up old backups (>$RETENTION_DAYS days)..."

BEFORE_COUNT=$(find "$BACKUP_DIR" -name "n8n-*.tar.gz" -o -name "n8n-*.sql.gz" | wc -l)

find "$BACKUP_DIR" -name "n8n-*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR" -name "n8n-*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR" -name "docker-compose-*.yml" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR" -name "env-*" -mtime +$RETENTION_DAYS -delete 2>/dev/null

AFTER_COUNT=$(find "$BACKUP_DIR" -name "n8n-*.tar.gz" -o -name "n8n-*.sql.gz" | wc -l)
DELETED=$((BEFORE_COUNT - AFTER_COUNT))

if [ $DELETED -gt 0 ]; then
    log_success "$DELETED old backup(s) deleted"
else
    log_info "No old backups to delete"
fi

# =============================================================================
# 6. Backup summary
# =============================================================================
echo ""
echo "======================================================================"
log_success "Backup completed successfully"
echo "======================================================================"
echo ""
log_info "Location: $BACKUP_DIR"
log_info "Latest backed up files:"
echo ""
ls -lh "$BACKUP_DIR" | grep "$DATE" | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
log_info "Disk space used by backups:"
du -sh "$BACKUP_DIR" | awk '{print "  Total: " $1}'
echo "======================================================================"

exit 0