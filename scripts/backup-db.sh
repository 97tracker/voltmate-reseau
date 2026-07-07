#!/usr/bin/env bash
# ==========================================================================
# VoltMate DB backup — dumps postgres to backups/, keeps the last 14.
#
# Usage: ./scripts/backup-db.sh
# Suggested cron: 0 3 * * * /opt/voltmate/scripts/backup-db.sh >> /opt/voltmate/backups/backup.log 2>&1
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[ -f .env ] || { echo "[x] .env not found."; exit 1; }
set -a; source .env; set +a

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/voltmate-${STAMP}.sql.gz"

echo "[i] Dumping voltmate-db to ${OUT} ..."
docker exec voltmate-db pg_dump -U "${POSTGRES_USER:-voltmate}" "${POSTGRES_DB:-voltmate}" | gzip > "$OUT"

echo "[✓] Backup written: ${OUT} ($(du -h "$OUT" | cut -f1))"

echo "[i] Pruning backups older than the last 14..."
ls -1t backups/voltmate-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -v --
