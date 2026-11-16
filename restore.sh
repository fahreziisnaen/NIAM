#!/usr/bin/env bash
# ==============================================================================
# Phillip Securities Hong Kong - Network Asset Management System (PSHK - NAMS)
# Enterprise Database & Document Upload Restore Utility
# ==============================================================================

set -euo pipefail

BACKUP_DIR="$(pwd)/backups"
DB_CONTAINER="phillip_postgres"
BACKEND_CONTAINER="phillip_backend"
DB_NAME="${POSTGRES_DB:-phillip_assets}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "================================================================="
echo "  PSHK - NAMS: Enterprise Database Restore Utility               "
echo "================================================================="

if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A "${BACKUP_DIR}"/*.sql.gz 2>/dev/null)" ]; then
    echo "[ERROR] No database backups found in '${BACKUP_DIR}'!"
    exit 1
fi

# Select backup file
if [ $# -ge 1 ] && [ -f "$1" ]; then
    TARGET_BACKUP="$1"
else
    echo "Available database backups in ${BACKUP_DIR}:"
    echo "-----------------------------------------------------------------"
    select BACKUP_FILE in $(ls -t "${BACKUP_DIR}"/db_backup_*.sql.gz); do
        if [ -n "${BACKUP_FILE}" ]; then
            TARGET_BACKUP="${BACKUP_FILE}"
            break
        else
            echo "Invalid selection. Please choose a valid number."
        fi
    done
fi

echo ""
echo "Selected Backup: ${TARGET_BACKUP}"
read -p "WARNING: Restoring will overwrite existing data in '${DB_NAME}'. Continue? (y/N): " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled by user."
    exit 0
fi

# 1. Temporarily pause backend service to prevent connection conflicts
echo "[1/4] Pausing backend container..."
docker compose stop backend || true

# 2. Restore PostgreSQL database
echo "[2/4] Restoring PostgreSQL database from ${TARGET_BACKUP}..."
gunzip -c "${TARGET_BACKUP}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" > /dev/null

# 3. Check and restore corresponding uploads archive if found
TIMESTAMP=$(basename "${TARGET_BACKUP}" | sed -E 's/db_backup_(.*)\.sql\.gz/\1/')
UPLOADS_ARCHIVE="${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz"

if [ -f "${UPLOADS_ARCHIVE}" ]; then
    echo "[3/4] Restoring document uploads from ${UPLOADS_ARCHIVE}..."
    docker exec "${BACKEND_CONTAINER}" sh -c 'mkdir -p /app/uploads && rm -rf /app/uploads/*' || true
    cat "${UPLOADS_ARCHIVE}" | docker exec -i "${BACKEND_CONTAINER}" tar -xzf - -C /app/uploads/ || true
else
    echo "[3/4] No matching uploads archive found for timestamp ${TIMESTAMP}. Preserving existing uploads."
fi

# 4. Restart backend service
echo "[4/4] Starting backend service..."
docker compose start backend

echo "================================================================="
echo "  [SUCCESS] Database restore completed successfully!            "
echo "================================================================="

