#!/usr/bin/env bash
# lui.sh — hồ sơ áp phần 4: đường lùi của 117 trên bản chép DB máy thu, kèm chiều đỏ.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
P=_acceptance/ghep-tin-vao-danh-muc/probes/lui.mjs
LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT

bash db/db-thu.sh oneinvest_suite_pl20_lui --chay node "$P"

echo "== Chiều đỏ: lùi chỉ bỏ view, không rút dòng"
if bash db/db-thu.sh oneinvest_suite_pl20_lui --chay node "$P" --lui-thieu-rut >"$LOG" 2>&1; then
  cat "$LOG"; echo "ĐỎ: lùi thiếu bước rút mà lệnh vẫn thoát 0"; exit 1
fi
grep -Eq 'sau lùi còn [0-9]+ dòng sống' "$LOG" || { cat "$LOG"; echo "ĐỎ: lệnh không nêu số dòng còn sống"; exit 1; }
grep -E 'sau lùi còn' "$LOG"
echo "XANH: lui và chiều đỏ"
