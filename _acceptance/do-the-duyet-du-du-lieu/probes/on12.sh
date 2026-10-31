#!/bin/bash
# E5b (do-the-duyet-du-du-lieu): trên DB thử riêng, một lượt do-the-duyet --write rồi ca ON12-AC-5 của app (dựng bảng «Kiểm
# chất lượng» thật, soi mọi dòng kiểm 7 ngày) — dòng the-duyet:* phải được diễn giải. Xoá DB thử khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_dtd_on12
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
ra=$(DATABASE_URL="$DB_URL" node pipeline/do-the-duyet.mjs --write)
echo "$ra" | tail -1
echo "$ra" | grep -Eq '^do-the-duyet: đã ghi [3-9][0-9]* dòng dq_check_results$' || { echo "LUOT GHI THAT KHONG DU DONG"; exit 1; }
kq=$(cd app && DATABASE_URL="$DB_URL" node --import tsx --test --test-name-pattern "ON12-AC-5" tests/ops-nhan-theo-context.test.tsx 2>&1) || { echo "$kq" | tail -40; echo "ON12-AC-5 DO"; exit 1; }
echo "$kq" | grep -E "^# ON12-AC-5|^ℹ (pass|fail)"
echo "$kq" | grep -q "^ℹ pass 1$" || { echo "ON12-AC-5 KHONG CHAY"; exit 1; }
grep -q '^\*\*Độ đủ thẻ duyệt\*\*' CONTEXT.md && grep -q 'kiểm `the-duyet:roi-kho`' CONTEXT.md || { echo "THIEU THUAT NGU CONTEXT.md"; exit 1; }
echo "ON12 OK"
