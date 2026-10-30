#!/bin/bash
# E9b (eval-classify-wilson): trên DB thử riêng có fixture nhãn, chạy một lượt eval:classify GHI THẬT rồi ca ON12-AC-5 của app
# (dựng bảng «Kiểm chất lượng» thật, soi mọi dòng kiểm 7 ngày) — dòng eval-classify phải được diễn giải. Xoá DB thử khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_ecw_on12
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
(cd app && DATABASE_URL="$URL" node --import tsx ../_acceptance/eval-classify-wilson/probes/nap-nhan.tsx)
ra=$(DATABASE_URL="$URL" node pipeline/eval-classify.mjs --lat ocp1)
echo "$ra" | tail -2
echo "$ra" | grep -Eq '^đã ghi [1-9][0-9]* dòng dq_check_results$' || { echo "LUOT GHI THAT KHONG GHI DONG NAO"; exit 1; }
kq=$(cd app && DATABASE_URL="$URL" node --import tsx --test --test-name-pattern "ON12-AC-5" tests/ops-nhan-theo-context.test.tsx 2>&1) || { echo "$kq" | tail -40; echo "ON12-AC-5 DO"; exit 1; }
echo "$kq" | grep -E "^# ON12-AC-5|^ℹ (pass|fail)"
echo "$kq" | grep -q "^ℹ pass 1$" || { echo "ON12-AC-5 KHONG CHAY"; exit 1; }
grep -q '^\*\*Độ đúng cách đọc\*\*' CONTEXT.md && grep -q 'kiểm `eval-classify`' CONTEXT.md || { echo "THIEU THUAT NGU CONTEXT.md"; exit 1; }
echo "ON12 OK"
