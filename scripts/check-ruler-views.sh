#!/bin/bash
# check-ruler-views.sh — kiểm migration 034 (v_ruler_p2_area / v_ruler_p2) và
# SQL bắt kịp cloud (docs/ops/cloud-catchup-2026-10-22.sql). Chỉ chạm DB local
# :5433 (container one-invest-db); DB tạm tự xoá. KHÔNG gọi cloud.
#
#   fresh    DB trống dựng từ mọi db/migrations/*.sql → hai view tồn tại, đúng cột
#   idem     áp 034 hai lần vào DB local → exit 0 cả hai, kết quả view không đổi
#   static   sync-cloud loại properties.seller_name; SQL catch-up không tạo cột đó;
#            view chỉ xuất cột aggregate
#   cloudsim DB mô phỏng cloud (migration 001–029) + catch-up chạy 2 lần → cột các
#            bảng sync khớp local trừ properties.seller_name; parent_id NULL được
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-}"
CT=one-invest-db
FAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; FAIL=1; }
q() { local db="$1"; shift; docker exec -i -e PGPASSWORD=oneinvest "$CT" psql -U oneinvest -h localhost -d "$db" -X -At -v ON_ERROR_STOP=1 "$@"; }
scratch() { q oneinvest -q -c "DROP DATABASE IF EXISTS $1" -c "CREATE DATABASE $1" 2>/dev/null; }
drop() { q oneinvest -q -c "DROP DATABASE IF EXISTS $1" 2>/dev/null; }

SYNC_TABLES="'areas','listings','market_metrics','listing_stats','area_breakdowns','market_asset_stats','nights','sale_offers','sellers','asset_nodes','properties','property_offers','area_sources','dq_check_results'"
cols_of() { q "$1" -F'|' -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ($SYNC_TABLES) ORDER BY 1,2"; }
view_cols() { q "$1" -c "SELECT string_agg(attname, ',' ORDER BY attnum) FROM pg_attribute WHERE attrelid = '$2'::regclass AND attnum > 0"; }
HASH_AREA="SELECT md5(coalesce(string_agg(area_id||':'||m||':'||n, ',' ORDER BY area_id),'')) FROM v_ruler_p2_area"
HASH_TYPE="SELECT md5(coalesce(string_agg(area_id||':'||coalesce(property_type,'-')||':'||m||':'||n, ',' ORDER BY area_id, property_type),'')) FROM v_ruler_p2"

case "$MODE" in
  fresh)
    DB=acc_ruler_fresh; trap 'drop $DB' EXIT; scratch $DB
    # Lỗi tồn đọng của 012/031 trên DB trống không thuộc phạm vi — chạy tiếp từng file
    for f in "$ROOT"/db/migrations/*.sql; do q $DB -q < "$f" >/dev/null 2>&1 || echo "note: $(basename "$f") lỗi trên DB trống (tồn đọng, ngoài phạm vi)"; done
    q $DB -q < "$ROOT/db/migrations/034_ruler_p2_views.sql" >/dev/null 2>&1 && pass "034 áp được trên DB dựng từ migrations" || fail "034 lỗi trên DB dựng từ migrations"
    [ "$(view_cols $DB v_ruler_p2_area)" = "area_id,m,n" ] && pass "v_ruler_p2_area cột area_id,m,n" || fail "v_ruler_p2_area sai/thiếu: $(view_cols $DB v_ruler_p2_area 2>&1)"
    [ "$(view_cols $DB v_ruler_p2)" = "area_id,property_type,m,n" ] && pass "v_ruler_p2 cột area_id,property_type,m,n" || fail "v_ruler_p2 sai/thiếu: $(view_cols $DB v_ruler_p2 2>&1)"
    ;;
  idem)
    B_A=$(q oneinvest -c "$HASH_AREA"); B_T=$(q oneinvest -c "$HASH_TYPE")
    for i in 1 2; do
      q oneinvest -q < "$ROOT/db/migrations/034_ruler_p2_views.sql" >/dev/null && pass "034 lần $i exit 0" || fail "034 lần $i lỗi"
    done
    [ "$B_A" = "$(q oneinvest -c "$HASH_AREA")" ] && pass "v_ruler_p2_area kết quả không đổi (md5 $B_A)" || fail "v_ruler_p2_area kết quả đổi sau 034"
    [ "$B_T" = "$(q oneinvest -c "$HASH_TYPE")" ] && pass "v_ruler_p2 kết quả không đổi (md5 $B_T)" || fail "v_ruler_p2 kết quả đổi sau 034"
    N=$(q oneinvest -c "SELECT count(*) FROM v_ruler_p2_area"); [ "${N:-0}" -gt 0 ] && pass "v_ruler_p2_area có $N phường" || fail "v_ruler_p2_area rỗng ở local"
    # Vế chặn: phường dưới ngưỡng 5 căn KHÔNG được vào ruler (đếm cùng điều kiện lọc của view)
    LOW=$(q oneinvest -c "SELECT count(*) FROM v_ruler_p2_area WHERE n < 5")
    UNDER=$(q oneinvest -c "SELECT count(*) FROM (SELECT pr.area_id FROM properties pr JOIN property_offers po ON po.property_id=pr.id JOIN sale_offers o ON o.offer_id=po.offer_id AND o.last_seen=(SELECT max(o2.last_seen) FROM sale_offers o2 JOIN property_offers po2 ON po2.offer_id=o2.offer_id WHERE po2.property_id=pr.id) WHERE pr.kind='sale' AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000 AND pr.area_id IS NOT NULL GROUP BY pr.area_id HAVING count(*) BETWEEN 1 AND 4) s WHERE s.area_id IN (SELECT area_id FROM v_ruler_p2_area)")
    [ "$LOW" = 0 ] && [ "$UNDER" = 0 ] && pass "không phường nào dưới 5 căn lọt vào ruler (n<5: $LOW, phường 1–4 căn có mặt: $UNDER)" || fail "phường dưới ngưỡng lọt vào ruler (n<5: $LOW, 1–4 căn: $UNDER)"
    UNDER_ALL=$(q oneinvest -c "SELECT count(*) FROM (SELECT pr.area_id FROM properties pr JOIN property_offers po ON po.property_id=pr.id JOIN sale_offers o ON o.offer_id=po.offer_id AND o.last_seen=(SELECT max(o2.last_seen) FROM sale_offers o2 JOIN property_offers po2 ON po2.offer_id=o2.offer_id WHERE po2.property_id=pr.id) WHERE pr.kind='sale' AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000 AND pr.area_id IS NOT NULL GROUP BY pr.area_id HAVING count(*) BETWEEN 1 AND 4) s")
    echo "note: $UNDER_ALL phường có 1–4 căn ở local (bị chặn đúng)"
    ;;
  static)
    grep -Eq '^\s*properties:\s*\[\s*"seller_name"\s*\]' "$ROOT/pipeline/sync-cloud.mjs" \
      && pass "sync-cloud PII_EXCLUDE có properties.seller_name" || fail "sync-cloud không loại properties.seller_name"
    grep -Eiq '^\s*ADD COLUMN[^-]*seller_name' "$ROOT/docs/ops/cloud-catchup-2026-10-22.sql" \
      && fail "SQL catch-up tạo cột seller_name trên cloud" || pass "SQL catch-up không tạo cột seller_name"
    grep -Eiq '^\s*(UPDATE|INSERT|DELETE|TRUNCATE)\b' "$ROOT/docs/ops/cloud-catchup-2026-10-22.sql" \
      && fail "SQL catch-up có câu ghi dữ liệu (chỉ được DDL)" || pass "SQL catch-up chỉ DDL"
    grep -Eiq 'seller|phone' "$ROOT/db/migrations/034_ruler_p2_views.sql" \
      && fail "034 nhắc cột người bán" || pass "034 không chạm cột người bán"
    ;;
  cloudsim)
    DB=acc_ruler_cloudsim; trap 'drop $DB' EXIT; scratch $DB
    for f in "$ROOT"/db/migrations/0[01]*.sql "$ROOT"/db/migrations/02*.sql; do q $DB -q < "$f" >/dev/null 2>&1; done
    for i in 1 2; do
      q $DB -q < "$ROOT/docs/ops/cloud-catchup-2026-10-22.sql" >/dev/null 2>&1 && pass "catch-up lần $i exit 0" || fail "catch-up lần $i lỗi"
    done
    # area_sources vắng trong mô phỏng do lỗi thứ tự 012 (cloud thật có bảng này)
    DIFF=$(comm -23 <(cols_of oneinvest | sort) <(cols_of $DB | sort) | grep -v '^area_sources|')
    [ "$DIFF" = "properties|seller_name" ] && pass "cột bảng sync khớp local, chỉ thiếu properties.seller_name" || fail "lệch cột ngoài dự kiến: $(echo $DIFF)"
    EXTRA=$(comm -13 <(cols_of oneinvest | sort) <(cols_of $DB | sort))
    [ -z "$EXTRA" ] && pass "không có cột thừa so với local" || fail "cột thừa: $(echo $EXTRA)"
    [ "$(q $DB -c "SELECT is_nullable||'/'||(column_default IS NULL) FROM information_schema.columns WHERE table_name='asset_nodes' AND column_name='parent_id'")" = "YES/true" ] \
      && pass "asset_nodes.parent_id NULL được, không default" || fail "asset_nodes.parent_id chưa theo 032"
    [ "$(view_cols $DB v_ruler_p2)" = "area_id,property_type,m,n" ] && pass "v_ruler_p2 có trên cloud mô phỏng" || fail "v_ruler_p2 thiếu trên cloud mô phỏng"
    ;;
  *) echo "usage: $0 fresh|idem|static|cloudsim"; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "check-ruler-views $MODE: OK" || echo "check-ruler-views $MODE: CÓ LỖI"
exit $FAIL
