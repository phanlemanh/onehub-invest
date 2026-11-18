#!/usr/bin/env bash
# Lệnh eval của hồ sơ thuoc-tinh-can-s16 (DA40). Đường suy từ vị trí script, không hardcode gốc kho.
set -euo pipefail
GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$GOC"
case "${1:-}" in
  ham)  exec node --test pipeline/tests/thuoc-tinh-can-s16.test.mjs ;;
  db)   exec bash db/db-thu.sh oneinvest_suite_ttc --chay node --test --test-concurrency=1 pipeline/tests/thuoc-tinh-can-s16.itest.mjs ;;
  that) exec node pipeline/tests/thuoc-tinh-can-s16-that.mjs ;;
  app)  cd app && exec bash ../db/db-thu.sh oneinvest_suite_ttc --chay node --import tsx --test --test-concurrency=1 tests/thuoc-tinh-can.test.tsx ;;
  *) echo "kiem.sh: dùng ham | db | that | app" >&2; exit 2 ;;
esac
