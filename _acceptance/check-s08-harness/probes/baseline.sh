#!/bin/bash
# AC-3: đối chứng âm — bản chép script kiểm bỏ import-s08-row.mjs khỏi danh sách chép → M0 phải ĐỎ vì thiếu đúng tệp đó.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R/pipeline"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
T=scripts/.check-s08-baseline-$$.mjs; trap 'rm -f "$T"' EXIT
sed 's/, "import-s08-row.mjs"\]/]/' scripts/check-s08-inventory.mjs > "$T"
cmp -s "$T" scripts/check-s08-inventory.mjs && { echo "không dựng được bản baseline (danh sách chép đổi dạng?)"; exit 2; }
# in lỗi của sync-pii.test trong thư mục tạm để thấy nguyên nhân
D=$(mktemp -d); trap 'rm -f "$T"; rm -rf "$D"' EXIT
for f in sync-cloud.mjs sync-pii.test.mjs import-airbnb.mjs; do cp "$f" "$D/"; done
ln -s "$PWD/node_modules" "$D/node_modules"; ln -s "$PWD/lib" "$D/lib"
err=$(cd "$D" && node --test sync-pii.test.mjs 2>&1 | grep -m1 -o "Cannot find module '[^']*'")
echo "lỗi thư mục tạm: ${err:-<không có>}"
o=$(node "$T" local-only 2>&1); rc=$?
echo "$o" | tail -6; echo "exit $rc"; bad=0
[ "$rc" != 0 ] || { echo "baseline phải đỏ"; bad=1; }
echo "$o" | grep -q '^SAI  M0 bản gốc' || { echo "M0 baseline không đỏ"; bad=1; }
echo "$err" | grep -q 'import-s08-row.mjs' || { echo "lỗi không nêu import-s08-row.mjs"; bad=1; }
[ "$bad" = 0 ] && echo "BASE OK"
exit "$bad"
