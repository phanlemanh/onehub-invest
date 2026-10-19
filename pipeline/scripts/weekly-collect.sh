#!/usr/bin/env bash
# weekly-collect.sh — chạy hàng tuần: discovery + listing batches + finalize.
# Gọi bằng launchd (com.oneinvest.collector.plist) hoặc tay:
#   bash pipeline/scripts/weekly-collect.sh
#   SKIP_COLLECT=1 bash pipeline/scripts/weekly-collect.sh   # chỉ chạy khúc pipeline
set -euo pipefail

# Mọi đường dẫn neo theo gốc monorepo — launchd chạy với cwd=/
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COLLECTOR_DIR="$ROOT/collector"
PIPELINE_DIR="$ROOT/pipeline"
CITY="${1:-hanoi}"
LOG="${LOG:-$PIPELINE_DIR/logs}"

mkdir -p "$LOG"
exec >>"$LOG/weekly-$CITY-$(date +%Y%m%d).log" 2>&1
echo "=== $(date) start weekly collect: $CITY ==="

if [ "${SKIP_COLLECT:-0}" != "1" ]; then
  # 1. Discovery (full pagination)
  (cd "$COLLECTOR_DIR" && npm run collect -- collect --city "$CITY" --source airbnb-discovery)

  # 2. Listing batches — lặp tới khi hết (mỗi batch 25, ~4 phút)
  for i in $(seq 1 20); do
    out=$(cd "$COLLECTOR_DIR" && npm run collect -- collect --city "$CITY" --source airbnb-listing 2>&1)
    echo "$out" | grep -E "\[airbnb-listing" | tail -1
    if echo "$out" | grep -q "không còn việc"; then
      echo "hết listing cần fetch"
      break
    fi
    sleep 3
  done
else
  echo "SKIP_COLLECT=1 — bỏ qua collector"
fi

# 3. Finalize: import → reassign-areas (phường theo tọa độ, G0-b) → transform
#    → 300_metrics → 400_breakdowns. Thứ tự nằm trong finalize-hanoi.sh,
#    psql đi qua docker compose ở $ROOT/db (DB_DIR).
bash "$PIPELINE_DIR/finalize-hanoi.sh"

echo "=== $(date) done ==="
