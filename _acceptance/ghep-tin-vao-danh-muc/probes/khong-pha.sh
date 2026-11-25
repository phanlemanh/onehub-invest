#!/usr/bin/env bash
# khong-pha.sh — E7 (AC-7): bước gắn cuối lượt nạp không phá lượt nạp, trên bản chép DB máy thu.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
P=_acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.mjs
LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT

bash db/db-thu.sh oneinvest_suite_pl20_kp --chay node "$P"

echo "== Chiều đỏ: cấy bài thử đã được gắn"
if bash db/db-thu.sh oneinvest_suite_pl20_kp --chay node "$P" --cay-bai-thu >"$LOG" 2>&1; then
  cat "$LOG"; echo "ĐỎ: cấy bài thử mà lệnh vẫn thoát 0"; exit 1
fi
grep -Eq 'bài thử được gắn: [0-9a-zA-Z_-]+' "$LOG" || { cat "$LOG"; echo "ĐỎ: lệnh không gọi tên bài thử vừa cấy"; exit 1; }
grep -E 'bài thử được gắn' "$LOG"
echo "XANH: khong-pha và chiều đỏ"
