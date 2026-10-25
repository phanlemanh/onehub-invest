#!/bin/bash
# AC-7: soát lộ tên/mã nguồn (ca AC-7 cũ) vẫn đo bằng mã canh; mã ống thật chỉ dùng trong khối GT (importer thật).
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
F=scripts/check-freshness.test.mjs; bad=0
o=$(node --test --test-name-pattern='^AC-7' "$F" 2>&1)
echo "$o" | grep -E '^ℹ (pass|fail|skipped) '
echo "$o" | grep -qx 'ℹ fail 0' && echo "$o" | grep -qx 'ℹ skipped 0' && ! echo "$o" | grep -qx 'ℹ pass 0' || { echo "ca AC-7 không xanh"; bad=1; }
grep -qF 'S06: ["canary-s06"],' "$F" || { echo "IDS.S06 không còn là mã canh"; bad=1; }
n=$(grep -cF '"chotot-ads"' "$F"); echo "literal \"chotot-ads\": $n dòng"
[ "$n" = 1 ] || { echo "literal mã ống phải đúng 1 dòng (hằng S06_PIPE)"; bad=1; }
gt=$(grep -n 'freshness-do-gio-thu-that-s03 (GT-' "$F" | head -1 | cut -d: -f1)
pre=$(head -n "$((gt - 1))" "$F" | grep -c 'S06_PIPE\|chotot-ads')
echo "mã ống trước khối GT (dòng $gt): $pre dòng"
[ "$pre" = 0 ] || { echo "mã ống lọt vào phần ca AC-1..AC-8"; bad=1; }
[ "$bad" = 0 ] && echo "AC7 OK"
exit "$bad"
