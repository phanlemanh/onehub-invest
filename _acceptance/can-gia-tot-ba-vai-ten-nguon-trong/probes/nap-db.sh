#!/usr/bin/env bash
# nap-db.sh — can-gia-tot-ba-vai-ten-nguon-trong E5 (AC-5): ca DB thật xanh trên mã thật, đột biến «không lọc tên rỗng» đỏ với thông điệp ghim.
set -uo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
T="$GOC/_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.test.mjs"
cd "$GOC"
OUT=$(bash db/db-thu.sh oneinvest_suite_cg20 --chay node --test "$T" 2>&1); A=$?
echo "$OUT" | grep -E "AC-5:|ℹ (pass|fail)"
[ "$A" = 0 ] || { echo "ĐỎ: ca AC-5 đỏ trên mã thật"; echo "$OUT" | tail -20; exit 1; }
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
sed 's/\.filter((t) => t\.length > 0);/;/' scripts/can-gia-tot-ba-vai-ten-nguon.mjs > "$TAM/can-gia-tot-ba-vai-ten-nguon.mjs"
grep -q "t.length > 0" "$TAM/can-gia-tot-ba-vai-ten-nguon.mjs" && { echo "HỎNG: không dựng được bản đột biến"; exit 1; }
OUT2=$(CG20_SRC="$TAM/can-gia-tot-ba-vai-ten-nguon.mjs" bash db/db-thu.sh oneinvest_suite_cg20 --chay node --test "$T" 2>&1); B=$?
if [ "$B" = 0 ]; then echo "HỎNG: đột biến «không lọc tên rỗng» vẫn xanh"; exit 1; fi
echo "$OUT2" | grep -qE "số tên [0-9]+, đếm độc lập [0-9]+" || { echo "HỎNG: đột biến đỏ nhưng thiếu thông điệp ghim"; echo "$OUT2" | tail -10; exit 1; }
echo "đỏ đúng AC-5 «không lọc tên rỗng»: $(echo "$OUT2" | grep -oE "số tên [0-9]+, đếm độc lập [0-9]+" | head -1)"
