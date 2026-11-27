#!/usr/bin/env bash
# offer-unit.sh — E5 (AC-5): ma trận một tin một mức, ô đầu–cuối với luật thật, 0 tin hai căn trên bản chép DB máy thu.
source "$(dirname "$0")/_chung.sh"
# View offer_unit hiện hành là của 138 (thay thân view của 131): đột biến view nhắm 138.
MIG="$ROOT/db/migrations/138_offer_unit_can_tu_phat_bieu.sql"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e5 --chay node --test --test-concurrency=1 --test-name-pattern='ra-truc|ra-can|xung-dot|giu-toa|khong-vao-view|bi-danh|dau-cuoi' tests/ghep-tin-truc-can-131.itest.mjs)
echo "== offer_unit trên mã thật"; xanh "offer_unit" "${CHAY[@]}"
echo "== Đột biến"
dot_bien hai-truc-khong-xung-dot "ô «hai-truc»" "$MIG" GHEP_MIG_138 "WHEN truc IS NOT NULL AND (NOT cung_toa OR cardinality(truc) > 1) THEN 'xung_dot'" "WHEN truc IS NOT NULL AND NOT cung_toa THEN 'xung_dot'" "${CHAY[@]}"
# Ô «trục + căn cùng trục ra căn» (finding S4 r2): view không bao giờ chọn được căn duy nhất thì ô phải đỏ.
dot_bien khong-ra-can "ô «truc-va-can-cung-truc»" "$MIG" GHEP_MIG_138 "HAVING count(*) = 1) END END AS can" "HAVING count(*) = 2) END END AS can" "${CHAY[@]}"
# Căn qua bí danh (finding S4 vòng 3): view bỏ căn của phát biểu, tra lại theo trục + tầng thì ô bí danh phải đỏ.
dot_bien bo-can-cua-phat-bieu "ô «bi-danh-mot-can»" "$MIG" GHEP_MIG_138 "f.evidence ->> 'unit' END AS can_pb" "NULL::text END AS can_pb" "${CHAY[@]}"
# Tầng danh bạ có số 0 đầu: view so chuỗi thô thì ô tầng 09 phải đỏ.
dot_bien so-tang-tho "ô «tang-09»" "$MIG" GHEP_MIG_138 "regexp_replace(u.floor, '^0+(?=[0-9])', '') = g.tang[1]" "u.floor = g.tang[1]" "${CHAY[@]}"
echo "XANH: offer_unit và bốn đột biến"
