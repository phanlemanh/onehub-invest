#!/bin/bash
# AC-1, AC-3, AC-4, AC-7 — migration 112 hai lần, hàm nạp ba trạng thái, leak gate trên DB thử, lùi
cd "$(dirname "$0")/../../.." && bash db/db-thu.sh oneinvest_suite_cten --chay node --test --test-concurrency=1 pipeline/scripts/source-name-entries.itest.mjs || exit 1
cd app && bash ../db/db-thu.sh oneinvest_suite_cten_app --chay env ONEHUB_SUITE_CHUNG=1 node --import tsx --test --test-concurrency=1 tests/che-ten-cho-doc-app.test.tsx
