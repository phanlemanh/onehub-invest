#!/bin/bash
# AC-8 (bỏ dòng chú thích): các đường thu không còn danh sách cứng và không tự quyết thu bằng cột enabled; mọi script vào có gọi cổng vòng đời.
set -uo pipefail
cd "${1:?gốc kho}"; bad=0
F="pipeline/apify-facebook-collector.mjs pipeline/collect-chotot.mjs scripts/chotot-daily.sh scripts/airdna-daily.sh scripts/smoke-daily.sh pipeline/scripts/weekly-with-jitter.sh"
n=$(grep -nE "FALLBACK_(GROUPS|REGIONS)|for CITY in hanoi|facebook\.com/groups/[0-9]|region_v2: *1[23]000" $F | grep -vE ":[0-9]+:[[:space:]]*(//|#)" | wc -l | tr -d ' ')
echo "chỗ còn danh sách cứng: $n"; [ "$n" = 0 ] || bad=1
n=$(grep -nE "\benabled\b" pipeline/apify-facebook-collector.mjs pipeline/collect-chotot.mjs scripts/chotot-daily.sh | grep -vE ":[0-9]+:[[:space:]]*(//|#)" | wc -l | tr -d ' ')
echo "chỗ đọc enabled trong đường thu: $n"; [ "$n" = 0 ] || bad=1
for f in pipeline/apify-facebook-collector.mjs pipeline/collect-chotot.mjs scripts/chotot-daily.sh scripts/airdna-daily.sh scripts/smoke-daily.sh pipeline/scripts/weekly-with-jitter.sh; do
  grep -q "vong-doi" "$f" && echo "ok   $f gọi cổng vòng đời" || { echo "FAIL $f không gọi cổng vòng đời"; bad=1; }
done
[ "$bad" = 0 ] && echo "KHONG-CUNG PASS" || echo "KHONG-CUNG FAIL"; exit "$bad"
