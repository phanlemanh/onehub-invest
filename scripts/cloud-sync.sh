#!/bin/bash
# cloud-sync.sh — C4: đẩy dữ liệu local → Supabase mỗi 15' (launchd).
# Outbound-only qua HTTPS (mạng này chặn TLS Postgres thẳng — xem sync-cloud.mjs).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"
exec node "$ROOT/pipeline/sync-cloud.mjs"
