#!/usr/bin/env bash
# doc-bu.sh — E11 (AC-10): kiểm tiền và danh sách của các lượt đọc bù đã chạy (chỉ đọc DB máy thu), rồi kiểm lệnh lập danh sách trên
# bản chép, gồm các chiều đỏ. Không gọi model.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/pipeline"
node --test scripts/ghep-tin-danh-muc-doc-bu.test.mjs >/dev/null
V1=$(ls eval-sets/pl20-doc-bu-[0-9a-f]*.json 2>/dev/null | head -1 || true)
[ -n "$V1" ] || { echo "ĐỎ: chưa có danh sách đóng băng của lượt 1"; exit 1; }
node scripts/ghep-tin-danh-muc-doc-bu.mjs --sau-doc "$V1" --run-id pl20-doc-bu-thu,pl20-doc-bu-1 --tran-usd 5
V2=$(ls eval-sets/pl20-doc-bu-v2-*.json 2>/dev/null | head -1 || true)
[ -n "$V2" ] || { echo "ĐỎ: chưa có danh sách đóng băng của lượt 2"; exit 1; }
node scripts/ghep-tin-danh-muc-doc-bu.mjs --sau-doc "$V2" --run-id pl20-doc-bu-2 --tran-usd 1
node scripts/ghep-tin-danh-muc-doc-bu.mjs --tong-tien --tran-usd 5
cd "$ROOT"
bash db/db-thu.sh oneinvest_suite_pl20_docbu --chay node _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu-do.mjs
