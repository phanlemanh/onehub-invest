#!/bin/bash
# airbnb-nightly.sh — PDP Airbnb theo worklist AirDNA mỗi đêm (Task 5 plan
# 2026-10-21-coverage-worklist), thay cron Chủ nhật discovery-only.
# Luồng: jitter ≤20′ (CCP) → regen worklist từ DB → N batch × 25 PDP
# (AIRBNB_NIGHTLY_BATCHES, default 32 ≈ 800 listing/đêm) → finalize
# multi-city (import + reassign + transform + metrics).
# Log: pipeline/logs/airbnb-nightly.log (StandardOutPath của launchd).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/collector"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

# dist có thể mất sau git clean — build nếu thiếu
[ -f dist/cli.js ] || npm run build

# jitter trước khi chạm Airbnb (CCP/ADR-0007); nút giảm để smoke không phải chờ
JITTER_MAX="${AIRBNB_NIGHTLY_JITTER_MAX:-1200}"
[ "$JITTER_MAX" -gt 0 ] && sleep $((RANDOM % JITTER_MAX))

echo "$(date -Iseconds) regen worklist từ universe AirDNA"
node "$ROOT/pipeline/export-airdna-worklist.mjs"

BATCHES="${AIRBNB_NIGHTLY_BATCHES:-32}"
for i in $(seq 1 "$BATCHES"); do
  echo "$(date -Iseconds) batch $i/$BATCHES"
  OUT="$(AIRBNB_LISTING_WORKLIST=state/airbnb-worklist.json node dist/cli.js collect --city vn --source airbnb-listing 2>&1)" || {
    echo "$OUT"; echo "$(date -Iseconds) batch $i FAIL — dừng, giữ nguyên cho đêm sau"; exit 1;
  }
  echo "$OUT"
  if echo "$OUT" | grep -q "không còn việc"; then
    echo "$(date -Iseconds) worklist hết — dừng sớm ở batch $i"
    break
  fi
done

echo "$(date -Iseconds) finalize multi-city"
bash "$ROOT/pipeline/finalize-airbnb.sh"
echo "$(date -Iseconds) done"
