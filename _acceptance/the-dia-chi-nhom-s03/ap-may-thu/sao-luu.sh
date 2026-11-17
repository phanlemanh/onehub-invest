#!/usr/bin/env bash
# sao-luu.sh — TG1 bước 1/5 trước khi áp (hay lùi) 108 trên DB máy thu: pg_dump lược đồ (định dạng custom) ra NGOÀI cây kho.
# Áp lần đầu: 108 chỉ thêm đối tượng mới, bản lược đồ đủ để dựng lại trạng thái trước áp. Đã có bảng thẻ (áp lại, hay trước
# khi lùi): ghi thêm dữ liệu hai bảng thẻ — quyết định của người vận hành không dựng lại được từ nguồn nào khác.
set -euo pipefail
DICH="${HOME}/onehub-backups/db"
case "$DICH" in "$(git rev-parse --show-toplevel 2>/dev/null || echo /khong-co)"*) echo "sao-luu: đích nằm trong cây kho — dừng" >&2; exit 2;; esac
mkdir -p "$DICH"
LUC="$(date -u +%Y%m%dT%H%M%SZ)"
TEP="$DICH/truoc-108-$LUC.dump"
DX=(docker exec -e PGPASSWORD=oneinvest one-invest-db)
"${DX[@]}" pg_dump -U oneinvest -h localhost -d oneinvest --schema-only -Fc > "$TEP"
[ -s "$TEP" ] || { echo "sao-luu: tệp rỗng $TEP" >&2; exit 1; }
echo "sao-luu: $TEP ($(wc -c < "$TEP") byte)"
CO=$("${DX[@]}" psql -U oneinvest -h localhost -d oneinvest -Atc "SELECT to_regclass('group_address_cards') IS NOT NULL")
if [ "$CO" = "t" ]; then
  THE="$DICH/the-dia-chi-$LUC.dump"
  "${DX[@]}" pg_dump -U oneinvest -h localhost -d oneinvest --data-only -t group_address_cards -t group_address_card_history -Fc > "$THE"
  [ -s "$THE" ] || { echo "sao-luu: tệp rỗng $THE" >&2; exit 1; }
  echo "sao-luu: $THE ($(wc -c < "$THE") byte)"
fi
