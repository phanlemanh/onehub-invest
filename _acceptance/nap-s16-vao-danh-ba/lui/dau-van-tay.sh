#!/usr/bin/env bash
# Dấu vân tay DB cho đường lùi DA33: băm lược đồ public + số dòng và băm nội dung các bảng mà lượt áp chạm.
# Chỉ đọc. In số và băm, không in dòng dữ liệu. Dùng: bash dau-van-tay.sh [tên DB, mặc định oneinvest] > <tệp>
set -euo pipefail
DB=${1:-oneinvest}
D(){ docker exec -e PGPASSWORD=oneinvest one-invest-db "$@"; }
Q(){ D psql -U oneinvest -h localhost -d "$DB" -Atc "$1"; }
echo "luoc_do $(D pg_dump -U oneinvest -h localhost -d "$DB" --schema-only --schema=public | grep -v '^--' | grep -v '^$' | grep -vE '^\\(un)?restrict ' | md5)"
for t in buildings:building_key stacks:stack_key units:unit_key registry_aliases:id review_queue:id field_assertions:id \
         asset_nodes:id source_registry:code airbnb_snapshots:snapshot_id iso_regions:admin_code; do
  b=${t%%:*}; k=${t#*:}
  if [ "$(Q "SELECT to_regclass('public.$b') IS NOT NULL")" = t ]; then
    echo "$b $(Q "SELECT count(*) || ' ' || coalesce(md5(string_agg(x::text, '|' ORDER BY x.$k)), '-') FROM $b x")"
  else echo "$b vang"; fi
done
