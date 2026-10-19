#!/usr/bin/env bash
# backup.sh — DR (ADR-0007): pg_dump tuần + raw zone mã hoá sang đĩa ngoài.
# RPO 7 ngày / RTO 1 ngày. BACKUP_DIR unset → ghi note + exit 0 (không fail
# cron); prune giữ 56 ngày (8 tuần).
#
# Env: BACKUP_DIR (bắt buộc để backup thật) · BACKUP_PASS (passphrase mã hoá;
# nếu unset, đọc từ macOS Keychain service oneinvest-backup do install-cron
# ghi — ADR-0007 DR: credential không nằm file plaintext).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date +%Y%m%d)"

if [ -z "${BACKUP_DIR:-}" ]; then
  echo "backup: BACKUP_DIR chưa đặt — bỏ qua (không fail). Trỏ về đĩa ngoài để bật DR." >&2
  exit 0
fi
if [ -z "${BACKUP_PASS:-}" ]; then
  BACKUP_PASS="$(security find-generic-password -w -s oneinvest-backup 2>/dev/null || true)"
fi
if [ -z "${BACKUP_PASS:-}" ]; then
  echo "backup: không có BACKUP_PASS (env hoặc Keychain oneinvest-backup)." >&2
  exit 1
fi
export BACKUP_PASS
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
