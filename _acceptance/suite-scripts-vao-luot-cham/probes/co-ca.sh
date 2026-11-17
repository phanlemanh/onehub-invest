#!/usr/bin/env bash
# E1/E2: chạy các ca khớp mẫu tên trong scripts/suite-neu-doi.test.mjs. `node --test --test-name-pattern` không khớp ca nào
# vẫn thoát 0 và tính chính tệp là một ca đạt (gốc main chưa có ca SSL-*), nên probe đếm dòng «✔ <mẫu>»: phải có ít nhất
# một, và không ca nào khớp mẫu bị bỏ qua (# SKIP).
#   bash co-ca.sh SSL-AC-1
set -uo pipefail
[ -n "${1:-}" ] || { echo "dùng: bash co-ca.sh <mẫu tên ca>"; exit 2; }
OUT=$(node --test --test-name-pattern="$1" scripts/suite-neu-doi.test.mjs 2>&1); RC=$?
echo "$OUT"
[ "$RC" -eq 0 ] || { echo "co-ca: ĐỎ — node --test thoát $RC"; exit 1; }
DAT=$(echo "$OUT" | grep -cF "✔ $1")
[ "$DAT" -ge 1 ] || { echo "co-ca: ĐỎ — không ca nào khớp «$1» chạy và đạt"; exit 1; }
if echo "$OUT" | grep -F "$1" | grep -qF "# SKIP"; then echo "co-ca: ĐỎ — có ca «$1» bị bỏ qua"; exit 1; fi
echo "co-ca: xanh — $DAT ca «$1» chạy và đạt"
