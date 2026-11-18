#!/usr/bin/env bash
# doc-bu.sh — E11 (AC-10): kiểm danh sách đọc bù trên bản chép DB máy thu; không gọi model.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
(cd pipeline && node --test scripts/ghep-tin-danh-muc-doc-bu.test.mjs >/dev/null)
bash db/db-thu.sh oneinvest_suite_pl20_docbu --chay node _acceptance/ghep-tin-vao-danh-muc/probes/doc-bu-do.mjs
