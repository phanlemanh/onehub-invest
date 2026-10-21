#!/bin/bash
# chotot-daily.sh — Vải công khai S06 Chợ Tốt: collect → import → transform.
# Chạy 05:30 hằng ngày qua launchd (trước AirDNA 19:05 — khác khung giờ,
# tách hoàn toàn khỏi các nguồn khác).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

node "$ROOT/pipeline/collect-chotot.mjs" || exit 1

# Import snapshot mới nhất mỗi thành phố rồi transform
for CITY in hanoi hcmc; do
  LATEST=$(ls -1d "$ROOT"/collector/snapshots/$CITY/${CITY}__chotot-ads__* 2>/dev/null | sort | tail -1)
  [ -n "$LATEST" ] && node "$ROOT/pipeline/import-chotot.mjs" "$LATEST"
done
node "$ROOT/pipeline/transform-chotot.mjs"
node "$ROOT/pipeline/refresh-bait-gap.mjs"
