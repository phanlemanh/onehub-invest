#!/usr/bin/env bash
# check-idempotent.selftest.sh — ca âm cho check-idempotent.sh: một migration KHÔNG
# idempotent (CREATE TABLE không IF NOT EXISTS) phải bị bắt (exit ≠ 0). Bảng tạm
# tên riêng mỗi lần chạy, luôn DROP khi thoát. Exit 0 = bộ kiểm bắt đúng.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
T="acc_nonidem_$$"
SQL="$(mktemp -t nonidem).sql"
echo "CREATE TABLE $T (x int);" > "$SQL"
cleanup() { docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -qAt -c "DROP TABLE IF EXISTS $T" >/dev/null; rm -f "$SQL"; }
trap cleanup EXIT
out="$(bash "$HERE/check-idempotent.sh" "$SQL" 2>&1)"; rc=$?
echo "$out"
if [ "$rc" -ne 0 ] && grep -q "không idempotent" <<<"$out"; then echo "SELFTEST PASS: migration không idempotent bị bắt"; exit 0; fi
echo "SELFTEST FAIL: check-idempotent.sh không bắt được migration không idempotent"; exit 1
