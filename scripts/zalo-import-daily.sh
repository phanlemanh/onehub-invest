#!/bin/bash
# zalo-import-daily.sh — nạp snapshot zalo-agent mới (Zalo + FB nếu bật)
# vào stg + refresh bait-gap. Tách khỏi apify-facebook-daily.sh 2026-10-21
# (user pause Facebook — nhưng Zalo pipe vẫn cần nạp hằng đêm 00:00).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

STATE="$ROOT/pipeline/logs/apify-daily.state"  # dùng chung state — không nạp lại
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | sort); do
  TS=$(basename "$SNAP" | sed 's/.*__//')
  if [[ "$TS" > "$LAST" ]]; then
    node "$ROOT/pipeline/import-airbnb.mjs" "$SNAP" || true
    [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
  fi
done
echo "$MAXTS" > "$STATE"
node "$ROOT/pipeline/transform-zalo.mjs"
node "$ROOT/pipeline/refresh-bait-gap.mjs"
