#!/bin/bash
# sao-luu.sh — sao lưu bảng source_registry của DB máy thu trước khi áp (che-ten-nguon-khong-lay-tu-dau). Không in nội dung.
set -euo pipefail
mkdir -p "$HOME/onehub-backups/db"
TEP="$HOME/onehub-backups/db/source_registry-$(date -u +%Y%m%dT%H%M%SZ).sql"
docker exec one-invest-db pg_dump -U oneinvest -d oneinvest -t source_registry --data-only --column-inserts > "$TEP"
chmod 600 "$TEP"
echo "đã sao lưu: $TEP ($(grep -c '^INSERT' "$TEP") dòng)"
