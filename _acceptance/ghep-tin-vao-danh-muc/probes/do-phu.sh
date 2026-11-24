#!/usr/bin/env bash
# do-phu.sh — E8 (AC-8): chép mới DB máy thu, áp 113 → 118 → 117, chạy bước gắn, đo độ phủ và đối chiếu phép đếm độc lập.
# Chép mới mỗi lần vì danh bạ đổi không làm đổi dấu lược đồ, bản mẫu của db-thu.sh có thể cũ tới 24 giờ.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
TEN=oneinvest_pl20_dophu
P=_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs
LOG="$(mktemp)"; trap 'rm -f "$LOG"; bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"

bash db/db-thu.sh "$TEN" >/dev/null
node "$P"

echo "== Chiều đỏ: gỡ phát biểu của một khu"
if node "$P" --go-khu >"$LOG" 2>&1; then cat "$LOG"; echo "ĐỎ: gỡ phát biểu một khu mà lệnh vẫn thoát 0"; exit 1; fi
grep -Eq 'lệch [0-9]+ tin' "$LOG" || { cat "$LOG"; echo "ĐỎ: lệnh không nêu lệch bao nhiêu tin"; exit 1; }
grep -E 'lệch [0-9]+ tin' "$LOG"
echo "XANH: do-phu và chiều đỏ"
