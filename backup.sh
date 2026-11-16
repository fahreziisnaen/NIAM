#!/usr/bin/env bash
# ==============================================================================
# Phillip Securities Hong Kong - Network Asset Management System (PSHK - NAMS)
# Enterprise Database & Document Upload Backup Utility
# ==============================================================================

set -euo pipefail

BACKUP_DIR="$(pwd)/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_CONTAINER="phillip_postgres"
BACKEND_CONTAINER="phillip_backend"
DB_NAME="${POSTGRES_DB:-phillip_assets}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "${BACKUP_DIR}"

echo "================================================================="
echo "  PSHK - NAMS: Starting Enterprise System Backup [${TIMESTAMP}]  "
echo "================================================================="

# 1. Verify PostgreSQL Container is Running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "[ERROR] Database container '${DB_CONTAINER}' is not running!"
    echo "Please ensure the system is running: docker compose up -d"
    exit 1
fi

# 2. Database Backup (Native PostgreSQL Compressed Dump)
DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
echo "[1/3] Dumping PostgreSQL database '${DB_NAME}'..."
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${DB_BACKUP_FILE}"

DB_SIZE=$(du -h "${DB_BACKUP_FILE}" | cut -f1)
echo "      -> Database backup saved: ${DB_BACKUP_FILE} (${DB_SIZE})"

# 3. Document Storage & Attachments Backup
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz"
if docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    echo "[2/3] Archiving uploaded documents and certificates..."
    docker exec "${BACKEND_CONTAINER}" tar -czf - -C /app/uploads . > "${UPLOADS_BACKUP_FILE}" 2>/dev/null || true
    if [ -s "${UPLOADS_BACKUP_FILE}" ]; then
        UPLOADS_SIZE=$(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1)
        echo "      -> Uploads archive saved: ${UPLOADS_BACKUP_FILE} (${UPLOADS_SIZE})"
    else
        rm -f "${UPLOADS_BACKUP_FILE}"
        echo "      -> Uploads directory was empty. Skipped archive."
    fi
fi

# 4. Retention Policy: Retain last 30 backups, prune older files
echo "[3/3] Applying retention policy (keeping last 30 backups)..."
ls -tp "${BACKUP_DIR}"/db_backup_*.sql.gz 2>/dev/null | grep -v '/$' | tail -n +31 | xargs -I {} rm -- {} 2>/dev/null || true
ls -tp "${BACKUP_DIR}"/uploads_backup_*.tar.gz 2>/dev/null | grep -v '/$' | tail -n +31 | xargs -I {} rm -- {} 2>/dev/null || true

echo "================================================================="
echo "  [SUCCESS] Backup completed successfully!                      "
echo "  Files location: ${BACKUP_DIR}                                 "
echo "================================================================="

