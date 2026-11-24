#!/usr/bin/env bash
# cham-tap-test.sh — E9 (AC-9): tính lại độ đúng từ đầu ra đóng băng và nhãn thô. Thiếu tệp đóng băng thì đỏ, không xanh giả.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/pipeline"
node --test scripts/ghep-tin-danh-muc-cham.test.mjs scripts/ghep-tin-danh-muc-lat-nhan.test.mjs >/dev/null
TEP=$(ls -t eval-sets/hai-khu-ghep-b-dau-ra-*.json 2>/dev/null | head -1 || true)
[ -n "$TEP" ] || { echo "ĐỎ: chưa có tệp đầu ra đóng băng của lát hai-khu-ghep-b"; exit 1; }
# Vòng 2 (n2 hụt ở vòng 1): n1 chấm lát -b trên bản chép DB lúc chấm vòng 1 (oneinvest_p4_pl20_cham, dựng 06:21Z 21/11, danh bạ
# băm 7157d5db…), n2 chấm lát -c trên DB hiện hành. Ngưỡng, cỡ mẫu và luật so bản đóng băng không đổi.
TEP2=$(ls -t eval-sets/hai-khu-ghep-c-dau-ra-*.json 2>/dev/null | head -1 || true)
VONG2=()
[ -n "$TEP2" ] && VONG2=(--cham-n2 "$TEP2" --db-n1 "${PL20_DB_N1:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p4_pl20_cham}")
MD="$ROOT/_acceptance/ghep-tin-vao-danh-muc/evidence/cham-tap-test.md"
mkdir -p "$(dirname "$MD")"
if [ -f "$MD" ]; then node scripts/ghep-tin-danh-muc-cham.mjs --cham "$TEP" ${VONG2[@]+"${VONG2[@]}"} --doi-chieu "$MD"
else node scripts/ghep-tin-danh-muc-cham.mjs --cham "$TEP" ${VONG2[@]+"${VONG2[@]}"} --ra "$MD"; fi
