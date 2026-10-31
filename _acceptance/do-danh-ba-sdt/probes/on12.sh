#!/bin/bash
# E5b (do-danh-ba-sdt): trên DB thử riêng, một lượt do-danh-ba-sdt --write rồi ca ON12-AC-5 của app (dựng bảng «Kiểm chất
# lượng» thật, soi mọi dòng kiểm 7 ngày) — dòng danh-ba-sdt:* phải được diễn giải. Xoá DB thử khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_ddb_on12
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
ra=$(DATABASE_URL="$URL" node pipeline/do-danh-ba-sdt.mjs --write)
echo "$ra" | tail -1
echo "$ra" | grep -Eq '^do-danh-ba-sdt: đã ghi 9 dòng dq_check_results$' || { echo "LUOT GHI THAT KHONG DU 9 DONG"; exit 1; }
kq=$(cd app && DATABASE_URL="$URL" node --import tsx --test --test-name-pattern "ON12-AC-5" tests/ops-nhan-theo-context.test.tsx 2>&1) || { echo "$kq" | tail -40; echo "ON12-AC-5 DO"; exit 1; }
echo "$kq" | grep -E "^# ON12-AC-5|^ℹ (pass|fail)"
echo "$kq" | grep -q "^ℹ pass 1$" || { echo "ON12-AC-5 KHONG CHAY"; exit 1; }
grep -q '^\*\*Danh bạ SĐT\*\*' CONTEXT.md && grep -q 'kiểm `danh-ba-sdt:n1`' CONTEXT.md || { echo "THIEU THUAT NGU CONTEXT.md"; exit 1; }
echo "ON12 OK"
