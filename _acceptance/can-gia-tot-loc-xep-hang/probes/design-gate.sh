#!/usr/bin/env bash
# Chạy cổng thiết kế của kho trên từng tệp giao diện mà vòng CG3 đổi.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc"
ag="${CLAUDE_PLUGIN_ROOT:-$(node "$HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs" --plugin acceptance-gate --require scripts/design-gate.mjs)}"
for f in app/src/app/ops/deals/page.tsx app/src/components/ops/deals-grid.tsx app/src/components/ops/deals-bo-loc.tsx app/src/components/ops/deals-cells.tsx; do
  node "$ag/scripts/design-gate.mjs" --jsdom app "$f"
done
