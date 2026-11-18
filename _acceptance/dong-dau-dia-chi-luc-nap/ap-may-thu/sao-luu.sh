#!/usr/bin/env bash
# sao-luu.sh — TG2 dong-dau-dia-chi-luc-nap: chép dòng field_assertions của ba luật mà TG2 ghi hay rút, trước lượt nạp đầu
# tiên sau khi gộp (và trước lượt đầu sau mỗi buổi duyệt thẻ). Ra ngoài cây kho; cả dòng sống lẫn đã rút.
set -euo pipefail
DIR="${HOME}/onehub-backups/db"
mkdir -p "$DIR"
TEP="$DIR/truoc-tg2-$(date -u +%Y%m%dT%H%M%SZ).csv"
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X -v ON_ERROR_STOP=1 -c \
  "\copy (SELECT * FROM field_assertions WHERE rule_id IN ('dia-chi-the-nhom', 'du-an-nhom-mot-du-an', 'du-an-ten-bai') ORDER BY id) TO STDOUT WITH CSV HEADER" \
  > "$TEP"
echo "đã chép $(($(wc -l < "$TEP") - 1)) dòng → $TEP"
