#!/bin/bash

# =============================================================================
# n8n diagnostic script for Synology DSM
# =============================================================================
# This script collects all useful information for debugging
# =============================================================================

PACKAGE_NAME="n8n"
PACKAGE_DIR="/var/packages/${PACKAGE_NAME}"
TARGET_DIR="${PACKAGE_DIR}/target"
DIAG_FILE="/tmp/n8n_diagnostic_$(date +%Y%m%d_%H%M%S).txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=============================================================="
echo "n8n DIAGNOSTIC - Synology DSM"
echo "=============================================================="
echo ""
echo "Collecting system information..."
echo "Diagnostic file: $DIAG_FILE"
echo ""

# Redirect everything to file
{
    echo "=============================================================="
    echo "n8n DIAGNOSTIC - $(date)"
    echo "=============================================================="
    echo ""

    # ==========================================================================
    # SYSTEM INFORMATION
    # ==========================================================================
    echo "=========================================="
    echo "1. SYSTEM INFORMATION"
    echo "=========================================="
    echo ""

    echo "--- Synology DSM ---"
    cat /etc/synoinfo.conf | grep -E "upnpmodelname|buildnumber" || echo "Unable to read synoinfo.conf"
    echo ""

    echo "--- Kernel ---"
    uname -a
    echo ""

    echo "--- User ---"
    whoami
    id
    echo ""

    echo "--- Date/Time ---"
    date
    timedatectl status 2>/dev/null || echo "timedatectl not available"
    echo ""

    # ==========================================================================
    # DOCKER
    # ==========================================================================
    echo "=========================================="
    echo "2. DOCKER / CONTAINER MANAGER"
    echo "=========================================="
    echo ""

    echo "--- Docker Version ---"
    if command -v docker &> /dev/null; then
        docker --version
        docker version 2>&1
    else
        echo "❌ Docker not found"
    fi
    echo ""

    echo "--- Docker Compose Version ---"
    if command -v docker-compose &> /dev/null; then
        docker-compose --version
    else
        echo "docker-compose: not found"
    fi

    if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
        docker compose version
    else
        echo "docker compose: not available"
    fi
    echo ""

    echo "--- Docker Containers ---"
    docker ps -a 2>&1
    echo ""

    echo "--- Docker Images ---"
    docker images 2>&1
    echo ""

    echo "--- Docker Networks ---"
    docker network ls 2>&1
    echo ""

    echo "--- Docker Volumes ---"
    docker volume ls 2>&1
    echo ""

    # ==========================================================================
    # n8n PACKAGE
    # ==========================================================================
    echo "=========================================="
    echo "3. n8n PACKAGE"
    echo "=========================================="
    echo ""

    echo "--- Package status ---"
    synopkg status n8n 2>&1
    echo ""

    echo "--- Package information ---"
    synopkg version n8n 2>&1
    echo ""

    # ==========================================================================
    # FILES AND STRUCTURE
    # ==========================================================================
    echo "=========================================="
    echo "4. FILE STRUCTURE"
    echo "=========================================="
    echo ""

    echo "--- Target directory ---"
    if [ -d "$TARGET_DIR" ]; then
        ls -lah "$TARGET_DIR"
    else
        echo "❌ Target directory does not exist: $TARGET_DIR"
    fi
    echo ""

    echo "--- docker-compose.yml file ---"
    if [ -f "$TARGET_DIR/docker-compose.yml" ]; then
        echo "✓ File found"
        cat "$TARGET_DIR/docker-compose.yml"
    else
        echo "❌ docker-compose.yml file not found"
    fi
    echo ""

    echo "--- .env file ---"
    if [ -f "$TARGET_DIR/.env" ]; then
        echo "✓ .env file found"
        # Mask sensitive values
        cat "$TARGET_DIR/.env" | sed 's/\(PASSWORD=\).*/\1***MASKED***/g' | sed 's/\(KEY=\).*/\1***MASKED***/g'
    else
        echo "❌ .env file not found"
    fi
    echo ""

    echo "--- Data directories ---"
    for dir in data files db backup; do
        if [ -d "$TARGET_DIR/$dir" ]; then
            echo "✓ $dir: $(du -sh "$TARGET_DIR/$dir" 2>/dev/null | cut -f1)"
            ls -lah "$TARGET_DIR/$dir" | head -10
        else
            echo "❌ $dir: does not exist"
        fi
    done
    echo ""

    # ==========================================================================
    # PERMISSIONS
    # ==========================================================================
    echo "=========================================="
    echo "5. PERMISSIONS"
    echo "=========================================="
    echo ""

    echo "--- Target permissions ---"
    ls -ld "$TARGET_DIR"
    echo ""

    echo "--- Main file permissions ---"
    for file in docker-compose.yml .env backup.sh; do
        if [ -e "$TARGET_DIR/$file" ]; then
            ls -l "$TARGET_DIR/$file"
        else
            echo "❌ $file: does not exist"
        fi
    done
    echo ""

    echo "--- n8n-user user ---"
    id n8n-user 2>&1
    echo ""

    # ==========================================================================
    # NETWORK
    # ==========================================================================
    echo "=========================================="
    echo "6. NETWORK"
    echo "=========================================="
    echo ""

    echo "--- Network interfaces ---"
    ip addr 2>&1 || ifconfig 2>&1
    echo ""

    echo "--- Listening ports ---"
    netstat -tuln | grep -E ":(5678|5432)" || echo "No port 5678 or 5432 listening"
    echo ""

    echo "--- Firewall ---"
    iptables -L -n 2>&1 | head -30 || echo "Unable to read iptables"
    echo ""

    # ==========================================================================
    # LOGS
    # ==========================================================================
    echo "=========================================="
    echo "7. LOGS"
    echo "=========================================="
    echo ""

    echo "--- Installation logs ---"
    if [ -f "/tmp/n8n_install.log" ]; then
        echo "✓ File found"
        tail -100 /tmp/n8n_install.log
    else
        echo "❌ Installation logs not found"
    fi
    echo ""

    echo "--- Service logs ---"
    if [ -f "/tmp/n8n_service.log" ]; then
        echo "✓ File found"
        tail -100 /tmp/n8n_service.log
    else
        echo "❌ Service logs not found"
    fi
    echo ""

    echo "--- Docker Compose logs ---"
    if [ -f "$TARGET_DIR/docker-compose.yml" ]; then
        cd "$TARGET_DIR"
        if command -v docker-compose &> /dev/null; then
            docker-compose logs --tail=100 2>&1
        elif command -v docker &> /dev/null; then
            docker compose logs --tail=100 2>&1
        fi
    else
        echo "❌ Unable to retrieve Docker Compose logs"
    fi
    echo ""

    # ==========================================================================
    # CONTAINER STATUS
    # ==========================================================================
    echo "=========================================="
    echo "8. CONTAINER STATUS"
    echo "=========================================="
    echo ""

    if docker ps -a --filter "name=n8n" 2>/dev/null | grep -q "n8n"; then
        echo "--- n8n container ---"
        docker inspect n8n 2>&1
        echo ""

        echo "--- n8n container logs ---"
        docker logs n8n --tail=100 2>&1
        echo ""
    else
        echo "❌ No n8n container found"
    fi

    if docker ps -a --filter "name=postgres" 2>/dev/null | grep -q "postgres"; then
        echo "--- PostgreSQL container ---"
        docker inspect n8n-postgres 2>&1
        echo ""

        echo "--- PostgreSQL container logs ---"
        docker logs n8n-postgres --tail=100 2>&1
        echo ""
    else
        echo "❌ No PostgreSQL container found"
    fi

    # ==========================================================================
    # PROCESSES
    # ==========================================================================
    echo "=========================================="
    echo "9. PROCESSES"
    echo "=========================================="
    echo ""

    echo "--- Docker processes ---"
    ps aux | grep -E "docker|n8n|postgres" | grep -v grep
    echo ""

    # ==========================================================================
    # DISK SPACE
    # ==========================================================================
    echo "=========================================="
    echo "10. DISK SPACE"
    echo "=========================================="
    echo ""

    df -h
    echo ""

    if [ -d "$TARGET_DIR" ]; then
        echo "--- n8n directory usage ---"
        du -sh "$TARGET_DIR"/*
    fi
    echo ""

    # ==========================================================================
    # SUMMARY
    # ==========================================================================
    echo "=========================================="
    echo "DIAGNOSTIC SUMMARY"
    echo "=========================================="
    echo ""

    # Checks
    CHECKS_OK=0
    CHECKS_FAIL=0

    echo "Checks:"

    if command -v docker &> /dev/null; then
        echo "✓ Docker installed"
        ((CHECKS_OK++))
    else
        echo "❌ Docker NOT installed"
        ((CHECKS_FAIL++))
    fi

    if command -v docker-compose &> /dev/null || (command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1); then
        echo "✓ Docker Compose available"
        ((CHECKS_OK++))
    else
        echo "❌ Docker Compose NOT available"
        ((CHECKS_FAIL++))
    fi

    if [ -f "$TARGET_DIR/docker-compose.yml" ]; then
        echo "✓ docker-compose.yml present"
        ((CHECKS_OK++))
    else
        echo "❌ docker-compose.yml MISSING"
        ((CHECKS_FAIL++))
    fi

    if [ -f "$TARGET_DIR/.env" ]; then
        echo "✓ .env file present"
        ((CHECKS_OK++))
    else
        echo "❌ .env file MISSING"
        ((CHECKS_FAIL++))
    fi

    if docker ps --filter "name=n8n" 2>/dev/null | grep -q "Up"; then
        echo "✓ n8n container active"
        ((CHECKS_OK++))
    else
        echo "❌ n8n container INACTIVE"
        ((CHECKS_FAIL++))
    fi

    echo ""
    echo "Score: $CHECKS_OK OK / $CHECKS_FAIL FAILED"
    echo ""
    echo "=============================================================="
    echo "END OF DIAGNOSTIC"
    echo "=============================================================="

} > "$DIAG_FILE" 2>&1

# Display summary
echo ""
echo -e "${GREEN}✓ Diagnostic completed!${NC}"
echo ""
echo "Diagnostic file created: $DIAG_FILE"
echo ""
echo -e "${YELLOW}To view the diagnostic:${NC}"
echo "  cat $DIAG_FILE"
echo ""
echo -e "${YELLOW}To copy the file:${NC}"
echo "  # Via SCP from your machine:"
echo "  scp admin@NAS_IP:$DIAG_FILE ."
echo ""
echo -e "${YELLOW}Or display directly:${NC}"
echo "  less $DIAG_FILE"
echo ""
echo "=============================================================="