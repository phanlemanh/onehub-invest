#!/bin/bash
# kiem-lui.sh <tệp sao lưu trước 122> — sau lui-122.sql: bảng source_registry phải TRÙNG bản sao lưu (cùng dòng, cùng giá trị).
# So bản dump mới với bản sao lưu, chỉ in số dòng khác — không in nội dung. DB_AP chỉ để chạy thử; mặc định DB máy thu.
set -euo pipefail
TEP="${1:?dùng: kiem-lui.sh <tệp sao lưu của sao-luu.sh>}"
DB="${DB_AP:-oneinvest}"
MOI=$(mktemp)
trap 'rm -f "$MOI"' EXIT
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d "$DB" -t source_registry --data-only --column-inserts > "$MOI"
KHAC=$(diff <(grep '^INSERT' "$TEP" | sort) <(grep '^INSERT' "$MOI" | sort) | grep -c '^[<>]' || true)
if [ "$KHAC" = "0" ]; then echo "LUI OK: bảng trùng bản sao lưu ($(grep -c '^INSERT' "$MOI") dòng)"; else echo "LUI LECH: $KHAC dòng khác bản sao lưu"; exit 1; fi
