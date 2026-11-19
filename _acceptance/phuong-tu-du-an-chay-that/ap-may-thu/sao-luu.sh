#!/usr/bin/env bash
# sao-luu.sh — DA45: chép trước lượt ghi đầu (1) mọi dòng field_assertions của luật phuong-tu-du-an, (2) area_id và
# field_provenance của mọi tin S03. Ra ngoài cây kho; chỉ đọc DB.
set -euo pipefail
DIR="${HOME}/onehub-backups/db"; mkdir -p "$DIR"
TS=$(date -u +%Y%m%dT%H%M%SZ)
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X -v ON_ERROR_STOP=1)
"${DX[@]}" -c "\copy (SELECT * FROM field_assertions WHERE rule_id = 'phuong-tu-du-an' ORDER BY id) TO STDOUT WITH CSV HEADER" > "$DIR/truoc-da45-phat-bieu-$TS.csv"
"${DX[@]}" -c "\copy (SELECT offer_id, area_id, field_provenance FROM sale_offer_records WHERE source = 'S03' ORDER BY offer_id) TO STDOUT WITH CSV HEADER" > "$DIR/truoc-da45-tin-s03-$TS.csv"
echo "đã chép $(($(wc -l < "$DIR/truoc-da45-phat-bieu-$TS.csv") - 1)) phát biểu, $(($(wc -l < "$DIR/truoc-da45-tin-s03-$TS.csv") - 1)) tin S03 → $DIR (*-$TS.csv)"
