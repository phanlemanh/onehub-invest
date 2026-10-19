#!/usr/bin/env bash
# backup.sh — DR (ADR-0007): pg_dump tuần + raw zone mã hoá sang đĩa ngoài.
# RPO 7 ngày / RTO 1 ngày. BACKUP_DIR unset → ghi note + exit 0 (không fail
# cron); prune giữ 56 ngày (8 tuần).
#
# Env: BACKUP_DIR (bắt buộc để backup thật) · BACKUP_PASS (passphrase openssl,
# bắt buộc khi BACKUP_DIR đặt) — KHÔNG hardcode giá trị thật trong file này.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date +%Y%m%d)"

if [ -z "${BACKUP_DIR:-}" ]; then
  echo "backup: BACKUP_DIR chưa đặt — bỏ qua (không fail). Trỏ về đĩa ngoài để bật DR." >&2
  exit 0
fi
if [ -z "${BACKUP_PASS:-}" ]; then
  echo "backup: BACKUP_PASS chưa đặt — cần passphrase mã hoá raw zone." >&2
  exit 1
fi
mkdir -p "$BACKUP_DIR"

# 1. Database dump (qua container, auth TCP — kartoza tắt peer auth)
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -h localhost -U oneinvest -d oneinvest | gzip > "$DB_FILE"
echo "db: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# 2. Raw zone mã hoá (snapshots + state + airdna profile — mapping SPL nằm
#    trong DB dump; credential không nằm ở đây)
RAW_FILE="$BACKUP_DIR/raw-$STAMP.tar.gz.enc"
tar -C "$ROOT/collector" -czf - snapshots state .airdna-profile 2>/dev/null \
  | openssl enc -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASS -out "$RAW_FILE"
echo "raw: $RAW_FILE ($(du -h "$RAW_FILE" | cut -f1))"

# 3. Prune > 56 ngày
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +56 -delete
find "$BACKUP_DIR" -name 'raw-*.tar.gz.enc' -mtime +56 -delete
echo "backup: done $STAMP"
