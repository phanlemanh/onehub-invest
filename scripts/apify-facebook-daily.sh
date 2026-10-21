#!/bin/bash
# apify-facebook-daily.sh — Thu thập tin BĐS từ Facebook Groups qua Apify
# (KHÔNG dùng account Facebook cá nhân — Apify dùng proxy infrastructure riêng)
#
# Chạy 4 lần/ngày (6h/lần) qua launchd, rồi nạp snapshot mới + transform S05.
# Chi phí: ~100 posts/run × 4 runs/ngày = 400 posts/ngày = ~$2/ngày trên free tier
#
# Env: ~/.oneinvest/cloud.env cần có APIFY_TOKEN
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
# Collector API cần key để accept requests
AGENT_KEY=$(cat $HOME/.openclaw/credentials/oneinvest-agent.key 2>/dev/null | tr -d '
')
export AGENT_API_KEYS="$AGENT_KEY"
node "$ROOT/pipeline/apify-facebook-collector.mjs"

# Posts FB/Zalo flush vào snapshot zalo-agent khi buffer đủ 50 — nạp MỌI
# snapshot mới hơn lần chạy trước (state-file; idempotent nhờ ON CONFLICT
# post_id; buffer chưa flush sẽ được nạp ở chuỗi sau) rồi transform.
STATE="$ROOT/pipeline/logs/apify-daily.state"
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | sort); do
  TS=$(basename "$SNAP" | sed 's/.*__//')  # yyyymmddThhmmss — sort chuỗi = thời gian
  if [[ "$TS" > "$LAST" ]]; then
    node "$ROOT/pipeline/import-airbnb.mjs" "$SNAP" || true
    [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
  fi
done
echo "$MAXTS" > "$STATE"
node "$ROOT/pipeline/transform-fb.mjs"
node "$ROOT/pipeline/refresh-bait-gap.mjs"
