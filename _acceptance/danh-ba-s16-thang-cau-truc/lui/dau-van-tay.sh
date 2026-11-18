#!/usr/bin/env bash
# Dấu vân tay DB cho đường lùi DA37 (khuôn DA33): băm lược đồ public + số dòng và băm nội dung các bảng mà lượt áp chạm.
# Chỉ đọc. In số và băm, không in dòng dữ liệu. Dùng: bash dau-van-tay.sh [tên DB, mặc định oneinvest] > <tệp>
set -euo pipefail
DB=${1:-oneinvest}
D(){ docker exec -e PGPASSWORD=oneinvest one-invest-db "$@"; }
Q(){ D psql -U oneinvest -h localhost -d "$DB" -Atc "$1"; }
echo "luoc_do $(D pg_dump -U oneinvest -h localhost -d "$DB" --schema-only --schema=public | grep -v '^--' | grep -v '^$' | grep -vE '^\\(un)?restrict ' | md5)"
for t in buildings:building_key stacks:stack_key units:unit_key registry_aliases:id review_queue:id; do
  b=${t%%:*}; k=${t#*:}
  echo "$b $(Q "SELECT count(*) || ' ' || coalesce(md5(string_agg(x::text, '|' ORDER BY x.$k)), '-') FROM $b x")"
done
# field_assertions: trừ hai cột rút (đường lùi rút, không xoá — AC-9)
echo "field_assertions $(Q "SELECT count(*) || ' ' || coalesce(md5(string_agg((to_jsonb(x) - 'retracted_at' - 'retract_reason')::text, '|' ORDER BY x.id)), '-') FROM field_assertions x")"
echo "v_toa_nut_vung $(Q "SELECT count(*) || ' ' || coalesce(md5(string_agg(x::text, '|' ORDER BY x.building_key)), '-') FROM v_toa_nut_vung x")"
# phần dư được phép (đếm, không so): nút phân khu do luật đúc mang meta.nghi, dòng luật có dao_at
echo "# du nut_nghi $(Q "SELECT count(*) FROM asset_nodes WHERE (meta ->> 'nghi')::boolean")"
echo "# du luat_dao $(Q "SELECT count(*) FROM project_link_rules WHERE source = 'S16' AND dao_at IS NOT NULL")"
