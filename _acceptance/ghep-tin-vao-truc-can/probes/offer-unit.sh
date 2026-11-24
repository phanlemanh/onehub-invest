#!/usr/bin/env bash
# offer-unit.sh — E5 (AC-5): ma trận một tin một mức, ô đầu–cuối với luật thật, 0 tin hai căn trên bản chép DB máy thu.
source "$(dirname "$0")/_chung.sh"
MIG="$ROOT/db/migrations/131_ghep_truc_can_tren_tin.sql"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e5 --chay node --test --test-concurrency=1 --test-name-pattern='ra-truc|ra-can|xung-dot|giu-toa|khong-vao-view|dau-cuoi' tests/ghep-tin-truc-can-131.itest.mjs)
echo "== offer_unit trên mã thật"; xanh "offer_unit" "${CHAY[@]}"
echo "== Đột biến"
dot_bien hai-truc-khong-xung-dot "ô «hai-truc»" "$MIG" GHEP_MIG_131 "WHEN truc IS NOT NULL AND (NOT cung_toa OR cardinality(truc) > 1) THEN 'xung_dot'" "WHEN truc IS NOT NULL AND NOT cung_toa THEN 'xung_dot'" "${CHAY[@]}"
echo "XANH: offer_unit và một đột biến"
