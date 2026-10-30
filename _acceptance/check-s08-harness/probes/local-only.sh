#!/bin/bash
# AC-1 + AC-2: chạy local-only của script kiểm trên cây này; M0 xanh, M1 bắt đột biến.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R/pipeline"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
[ -e node_modules ] || { echo "thiếu pipeline/node_modules"; exit 2; }
o=$(node scripts/check-s08-inventory.mjs local-only 2>&1); rc=$?
echo "$o" | tail -8; echo "exit $rc"; bad=0
[ "$rc" = 0 ] || bad=1
echo "$o" | grep -qx 'S08 LOCAL-ONLY PASS' || { echo "thiếu S08 LOCAL-ONLY PASS"; bad=1; }
echo "$o" | grep -q '^ok   M0 bản gốc: sync-pii.test xanh' || { echo "M0 không xanh"; bad=1; }
echo "$o" | grep -q '^ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ' || { echo "M1 không bắt đột biến"; bad=1; }
[ "$bad" = 0 ] && echo "LO OK"
exit "$bad"
