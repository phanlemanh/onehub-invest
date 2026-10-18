#!/usr/bin/env bash
# weekly-collect.sh — chạy hàng tuần: discovery + listing batches + finalize.
# Gọi bằng launchd (com.oneinvest.collector.plist) hoặc tay:
#   bash pipeline/scripts/weekly-collect.sh
set -euo pipefail

COLLECTOR="${COLLECTOR:-$HOME/dev/one-invest}"
SRC="${SRC:-$COLLECTOR/src}"
PIPELINE="$COLLECTOR/pipeline"
CITY="${1:-hanoi}"
LOG="${LOG:-$COLLECTOR/pipeline/logs}"

mkdir -p "$LOG"
exec >>"$LOG/weekly-$CITY-$(date +%Y%m%d).log" 2>&1
echo "=== $(date) start weekly collect: $CITY ==="

# 1. Discovery (full pagination)
cd "$SRC/../.." 2>/dev/null || true
(cd "$COLLECTOR" 2>/dev/null || cd "$HOME/dev/one-invest-collector"; npm run collect -- collect --city "$CITY" --source airbnb-discovery)

# 2. Listing batches — lặp tới khi hết (mỗi batch 25, ~4 phút)
for i in $(seq 1 20); do
  out=$(cd "$HOME/dev/one-invest-collector" && npm run collect -- collect --city "$CITY" --source airbnb-listing 2>&1)
  echo "$out" | grep -E "\[airbnb-listing" | tail -1
  if echo "$out" | grep -q "không còn việc"; then
    echo "hết listing cần fetch"
    break
  fi
  sleep 3
done

# 3. Finalize: import mọi snapshot mới + transform + metrics + breakdowns
bash "$PIPELINE/finalize-hanoi.sh"

# 4. Reassign areas (point-in-polygon) + rebuild metrics/breakdowns
(cd "$PIPELINE" && node reassign-areas.mjs)
(cd "$COLLECTOR/db" && docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -q < "$PIPELINE/sql/300_metrics.sql")
(cd "$COLLECTOR/db" && docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -q < "$PIPELINE/sql/400_breakdowns.sql")

echo "=== $(date) done ==="
