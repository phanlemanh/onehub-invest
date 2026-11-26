#!/bin/bash
# sao-luu.sh — sao lưu bảng source_registry của DB máy thu TRƯỚC khi áp 122 (so-nguon-kho-khai-bao). Không in nội dung.
# DB_AP chỉ để chạy thử trên DB thử; mặc định DB máy thu.
set -euo pipefail
DB="${DB_AP:-oneinvest}"
THU_MUC="${SAO_LUU_DIR:-$HOME/onehub-backups/db}"  # SAO_LUU_DIR chỉ để chạy thử
mkdir -p "$THU_MUC"
TEP="$THU_MUC/source_registry-truoc-122-$(date -u +%Y%m%dT%H%M%SZ).sql"
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d "$DB" -t source_registry --data-only --column-inserts > "$TEP"
chmod 600 "$TEP"
echo "đã sao lưu: $TEP ($(grep -c '^INSERT' "$TEP") dòng)"
