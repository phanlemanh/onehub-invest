#!/usr/bin/env bash
# chay.sh AC-<n> — chạy ca NB11 tương ứng trên DB của riêng lượt.
set -euo pipefail
AC="${1:?thiếu AC-<n>}"; N="${AC#AC-}"
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC/agent"
case "$N" in
  4) exec bash ../db/db-thu.sh oneinvest_suite_nb11 --chay node --import tsx --test tests/enrich-db.test.ts ;;
  5) test -z "$(git -C "$GOC" diff origin/main...HEAD -- agent/src/enrich/route.ts agent/src/enrich/doc-toan-bo.ts)" || { echo "route.ts/doc-toan-bo.ts bị đổi"; exit 1; }
     grep -q "chanTuApCanCu: true" scripts/enrich-run.ts || { echo "enrich-run.ts không khai chanTuApCanCu: true"; exit 1; }
     node --import tsx --test tests/enrich-route.test.ts
     exec bash ../db/db-thu.sh oneinvest_suite_nb11 --chay bash -c 'node --import tsx --test --test-name-pattern "^E5 " tests/enrich-luot-dem-khong-tu-ap.test.ts && node --import tsx --test --test-name-pattern "^LS1-AC-3 " tests/doc-toan-bo-db.itest.ts' ;;
  1|2|3|6) exec bash ../db/db-thu.sh oneinvest_suite_nb11 --chay node --import tsx --test --test-name-pattern "^E${N} " tests/enrich-luot-dem-khong-tu-ap.test.ts ;;
  *) echo "chay.sh: AC không hợp lệ: $AC"; exit 2 ;;
esac
