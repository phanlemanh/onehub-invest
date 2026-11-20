#!/bin/bash
# sao-luu.sh — sao lưu bảng source_registry của DB máy thu trước khi áp (che-ten-nguon-khong-lay-tu-dau). Không in nội dung.
set -euo pipefail
DB="${DB_AP:-oneinvest}"  # DB_AP chỉ để chạy thử trên DB thử; mặc định DB máy thu
mkdir -p "$HOME/onehub-backups/db"
TEP="$HOME/onehub-backups/db/source_registry-$(date -u +%Y%m%dT%H%M%SZ).sql"
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d "$DB" -t source_registry --data-only --column-inserts > "$TEP"
chmod 600 "$TEP"
echo "đã sao lưu: $TEP ($(grep -c '^INSERT' "$TEP") dòng)"
