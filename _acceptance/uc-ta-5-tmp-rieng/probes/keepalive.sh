#!/bin/bash
# AC-4: máy chủ giả của ui-capture-browser.test giữ kết nối ≥ 120 s; diff không đụng assert.
set -uo pipefail
cd "${1:?gốc kho}"; bad=0; base=$(git merge-base origin/main HEAD)
F=scripts/ui-capture-browser.test.mjs
v=$(grep -oE 'keepAliveTimeout = [0-9]+' "$F" | grep -oE '[0-9]+' | head -1)
echo "keepAliveTimeout = ${v:-không có}"; [ "${v:-0}" -ge 120000 ] || bad=1
x=$(git diff "$base" HEAD -- "$F" | grep -E '^[-+][^-+]' | grep -c 'assert' || true)
echo "dòng assert đổi: $x"; [ "$x" = 0 ] || bad=1
[ "$bad" = 0 ] && echo "KEEPALIVE OK"; exit "$bad"
