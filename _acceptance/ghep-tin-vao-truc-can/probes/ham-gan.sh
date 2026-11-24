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
echo "XANH: ma trận và ba đột biến"
