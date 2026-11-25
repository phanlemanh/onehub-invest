#!/bin/bash
# HT6 AC-7 (vế DB máy thu): chạy thử lượt bù 22–24/11 trên DB thật — chỉ đọc, không gọi model, không đòi khoá.
# Đạt: thoát 0, có dòng tổng, có dòng cho 2026-11-22 và 2026-11-23. Chiều đỏ: lệnh chưa có `bu` → thoát 2 «lệnh: chay | …».
set -uo pipefail
cd "$(dirname "$0")/../../../agent" || exit 2
ra=$(node --import tsx scripts/doc-gop-s03.ts bu --tu 2026-11-22 --den 2026-11-24 --thu 2>&1); ma=$?
echo "$ra"
[ "$ma" -eq 0 ] || { echo "FAIL bu --thu thoat $ma"; exit 1; }
for d in 2026-11-22 2026-11-23; do echo "$ra" | grep -q "hang-ngay $d" || { echo "FAIL thieu dong ngay $d"; exit 1; }; done
echo "$ra" | grep -q '^bu tong' || { echo "FAIL thieu dong tong"; exit 1; }
echo "ok bu --thu"
