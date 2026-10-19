#!/usr/bin/env bash
# api-launchd.sh — khởi động Collector API cho launchd (đọc key từ file,
# không hardcode; launchd PATH tối giản nên node neo tuyệt đối).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export AGENT_API_KEYS="$(cat "$HOME/.openclaw/credentials/oneinvest-agent.key")"
export AGENT_PORT=9210
cd "$ROOT"
exec /Users/manhphan/.local/bin/node dist/api/main.js
