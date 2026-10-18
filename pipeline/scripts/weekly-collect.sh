#!/usr/bin/env bash
# weekly-collect.sh — chạy hàng tuần: discovery + listing batches + finalize.
# Gọi bằng launchd (com.oneinvest.collector.plist) hoặc tay:
#   bash pipeline/scripts/weekly-collect.sh
set -euo pipefail

COLLECTOR="$(cd "$(dirname "$0")/.." COLLECTOR="${COLLECTOR:-$HOME/dev/one-invest}"COLLECTOR="${COLLECTOR:-$HOME/dev/one-invest}" pwd)"
SRC="${SRC:-../collector/src}"
PIPELINE="../collector/pipeline"
CITY="${1:-hanoi}"
LOG="${LOG:-../collector/pipeline/logs}"

mkdir -p "$LOG"
exec >>"$LOG/weekly-$CITY-$(date +%Y%m%d).log" 2>&1
echo "=== $(date) start weekly collect: $CITY ==="

# 1. Discovery (full pagination)
cd "$SRC/../.." 2>/dev/null || true
(cd "../collector" 2>/dev/null || cd "/bin/../collector"; npm run collect -- collect --city "$CITY" --source airbnb-discovery)

# 2. Listing batches — lặp tới khi hết (mỗi batch 25, ~4 phút)
for i in $(seq 1 20); do
  out=$(cd "/bin/../collector" && npm run collect -- collect --city "$CITY" --source airbnb-listing 2>&1)
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
(cd "../collector/db" && docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -q < "$PIPELINE/sql/300_metrics.sql")
(cd "../collector/db" && docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -q < "$PIPELINE/sql/400_breakdowns.sql")

echo "=== $(date) done ==="
