#!/usr/bin/env bash
# ham-gan.sh — E1, E2, E3 (AC-1, AC-2, AC-3): ma trận hàm gắn xanh trên mã thật, rồi từng bản đột biến làm đỏ đúng ca của nó.
source "$(dirname "$0")/_chung.sh"
LIB=lib/ghep-tin-truc-can.mjs
CHAY=(node --test scripts/ghep-tin-truc-can.test.mjs)
echo "== Ma trận trên mã thật"; xanh "ma trận hàm gắn" "${CHAY[@]}"
echo "== Đột biến"
dot_bien bo-so-tien-to-toa "ô «toa-lech»" $LIB GHEP_CAN_LIB 'if (hop.some((x) => x.toa !== toa)) return { ly_do: "toa-lech" };' '' "${CHAY[@]}"
dot_bien tra-truc-moi-toa "ô «truc-cung-so-toa-khac-khong-chon»" $LIB GHEP_CAN_LIB 'const stacks = d.truc.get(toa)?.get(x.truc) ?? [];' 'const stacks = [...d.truc.values()].flatMap((m) => m.get(x.truc) ?? []).slice(0, 1);' "${CHAY[@]}"
dot_bien lay-tang-ma-khi-lech "ô «tang-lech»" $LIB GHEP_CAN_LIB 'if (tangMa && tangC.length === 1 && tangC[0] !== tangMa) {' 'if (false) {' "${CHAY[@]}"
# Ô «tầng 09 với 9» (finding S4 r2): giữ số 0 đầu của tầng thì mã «09» và chữ «9» lệch — ô phải đỏ.
dot_bien giu-so-0-tang "ô «tang-09-khop-9»" $LIB GHEP_CAN_LIB 'const m = /^0*([1-9][0-9]{0,2})([A-Z]?)$/.exec(boDau(t)' 'const m = /^(0*[1-9][0-9]{0,2})([A-Z]?)$/.exec(boDau(t)' "${CHAY[@]}"
# AC-3 «floor_raw của bộ đọc chữ không bị rút hay đè» (finding S4 r2): đo trên DB thử, lượt gắn rút rồi chèn lại dòng tầng suy từ mã.
CHAY_DB=(bash ../db/db-thu.sh oneinvest_suite_pl36_e3 --chay node --test --test-concurrency=1 --test-name-pattern='luot-dau|floor-raw' tests/ghep-tin-truc-can-ghi.itest.mjs)
echo "== floor_raw bộ đọc chữ trên DB thử"; xanh "floor_raw bộ đọc chữ" "${CHAY_DB[@]}"
dot_bien rut-ca-floor-raw "floor-raw-cua-bo-doc-chu-khong-bi-rut-hay-de" lib/ghep-tin-truc-can-ghi.mjs GHEP_CAN_GHI_LIB 'WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`' "WHERE retracted_at IS NULL AND (rule_id = ANY (\$1::text[]) OR field = 'floor_raw')\`" "${CHAY_DB[@]}"
echo "XANH: ma trận, floor_raw và bốn đột biến"
