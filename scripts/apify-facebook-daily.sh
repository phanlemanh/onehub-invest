#!/bin/bash
# apify-facebook-daily.sh — Thu thập tin BĐS từ Facebook Groups qua Apify
# (KHÔNG dùng account Facebook cá nhân — Apify dùng proxy infrastructure riêng)
#
# Chạy 4 lần/ngày (6h/lần) qua launchd
# Chi phí: ~100 posts/run × 4 runs/ngày = 400 posts/ngày = ~$2/ngày trên free tier
#
# Env: ~/.oneinvest/cloud.env cần có APIFY_TOKEN
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
# Collector API cần key để accept requests
AGENT_KEY=$(cat $HOME/.openclaw/credentials/oneinvest-agent.key 2>/dev/null | tr -d '
')
export AGENT_API_KEYS="$AGENT_KEY"
exec node "$ROOT/pipeline/apify-facebook-collector.mjs"
