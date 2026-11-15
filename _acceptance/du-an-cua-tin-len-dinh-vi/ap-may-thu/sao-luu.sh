#!/usr/bin/env bash
# sao-luu.sh — DV7 bước 1/5 trước khi áp 105 lên DB máy thu: pg_dump lược đồ (định dạng custom) ra NGOÀI cây kho.
# 105 chỉ đổi lược đồ (một view + thân hai hàm), không chạm dòng dữ liệu nào → bản lược đồ đủ để dựng lại đúng trạng thái
# trước áp (pg_restore -s), và nhẹ hơn bản đầy đủ ~490 MB nhiều lần. pg_dump chỉ lấy khoá đọc.
set -euo pipefail
DICH="${HOME}/onehub-backups/db"
case "$DICH" in "$(git rev-parse --show-toplevel 2>/dev/null || echo /khong-co)"*) echo "sao-luu: đích nằm trong cây kho — dừng" >&2; exit 2;; esac
mkdir -p "$DICH"
TEP="$DICH/truoc-105-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest --schema-only -Fc > "$TEP"
[ -s "$TEP" ] || { echo "sao-luu: tệp rỗng $TEP" >&2; exit 1; }
echo "sao-luu: $TEP ($(wc -c < "$TEP") byte)"
