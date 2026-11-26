#!/usr/bin/env bash
# offer-building-nhanh.sh — E7 (AC-7): offer_building sau 131 giữ nguyên đầu ra so với 117, nhanh; offer_unit nhanh.
source "$(dirname "$0")/_chung.sh"
MIG="$ROOT/db/migrations/131_ghep_truc_can_tren_tin.sql"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e7 --chay node --test --test-concurrency=1 --test-name-pattern='offer-building' tests/ghep-tin-truc-can-131.itest.mjs)
echo "== offer_building trên mã thật"; xanh "offer_building" "${CHAY[@]}"
echo "== Đột biến"
dot_bien doi-mot-dong-dau-ra "offer_building sau 131 khác 117" "$MIG" GHEP_MIG_131 "CASE WHEN toa_hop_le THEN 'toa' WHEN upis IS NULL AND vung IS NOT NULL THEN 'vung' END AS muc" "CASE WHEN toa_hop_le THEN 'toa' WHEN upis IS NULL AND vung IS NOT NULL THEN 'vung-sai' END AS muc" "${CHAY[@]}"
dot_bien bo-materialized "kế hoạch thiếu bước «CTE toa_vung»" "$MIG" GHEP_MIG_131 "toa_vung AS MATERIALIZED (SELECT" "toa_vung AS NOT MATERIALIZED (SELECT" "${CHAY[@]}"
echo "XANH: offer_building và hai đột biến"
