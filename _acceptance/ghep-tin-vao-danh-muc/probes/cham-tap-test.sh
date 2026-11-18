#!/usr/bin/env bash
# cham-tap-test.sh — E9 (AC-9): tính lại độ đúng từ đầu ra đóng băng và nhãn thô. Thiếu tệp đóng băng thì đỏ, không xanh giả.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/pipeline"
node --test scripts/ghep-tin-danh-muc-cham.test.mjs scripts/ghep-tin-danh-muc-lat-nhan.test.mjs >/dev/null
TEP=$(ls -t eval-sets/hai-khu-ghep-b-dau-ra-*.json 2>/dev/null | head -1 || true)
[ -n "$TEP" ] || { echo "ĐỎ: chưa có tệp đầu ra đóng băng của lát hai-khu-ghep-b"; exit 1; }
MD="$ROOT/_acceptance/ghep-tin-vao-danh-muc/evidence/cham-tap-test.md"
mkdir -p "$(dirname "$MD")"
if [ -f "$MD" ]; then node scripts/ghep-tin-danh-muc-cham.mjs --cham "$TEP" --doi-chieu "$MD"
else node scripts/ghep-tin-danh-muc-cham.mjs --cham "$TEP" --ra "$MD"; fi
