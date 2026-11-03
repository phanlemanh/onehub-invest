#!/usr/bin/env bash
# Build trước để không chấm bản dist cũ.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
(cd "$ROOT/collector" && npm run build --silent)
node "$ROOT/_acceptance/s08-noi-tiep/probes/catalog-rong.mjs"
