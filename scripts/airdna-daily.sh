#!/bin/bash
# airdna-daily.sh — quét AirDNA toàn quốc mỗi đêm (E2 mở rộng).
# 1) airdna-rotate chọn N market chưa thu gần đây (xoay vòng, cap CCP/ADR-0009)
# 2) collect --city vn (activity window 19-23h + jitter + cap do scheduler giữ)
# 3) transform-airdna + dq-truthful-coverage
# Log: pipeline/logs/airdna-daily.log (StandardOutPath của launchd)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/collector"

# dist có thể mất sau git clean — build nếu thiếu
[ -f dist/cli.js ] || npm run build

SLICE="$(node "$ROOT/pipeline/airdna-rotate.mjs")"
if [ -z "$SLICE" ]; then
  echo "$(date -Iseconds) rotation: không còn market nào cần thu"
  exit 0
fi
echo "$(date -Iseconds) rotation slice: $SLICE"

AIRDNA_MARKETS="$SLICE" node dist/cli.js collect --city vn --source airdna-research

SNAP="$(ls -td snapshots/vn/vn__airdna-research__* 2>/dev/null | head -1)"
if [ -n "$SNAP" ]; then
  echo "$(date -Iseconds) transform $SNAP"
  node "$ROOT/pipeline/transform-airdna.mjs" "$ROOT/collector/$SNAP"
  node "$ROOT/pipeline/dq-truthful-coverage.mjs"
  node "$ROOT/pipeline/export-airdna-worklist.mjs"
else
  echo "$(date -Iseconds) không thấy snapshot mới (ngoài activity window?)" >&2
fi
echo "$(date -Iseconds) done"
