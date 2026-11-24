#!/usr/bin/env bash
# dong.sh AC-<n> — chạy đúng ca E<n> của pipeline/scripts/dong-the-bo-sung-tin.test.mjs trên DB của riêng lượt.
set -euo pipefail
AC="${1:?thiếu AC-<n>}"; N="${AC#AC-}"
[[ "$N" =~ ^[1-9]$ ]] || { echo "dong.sh: AC không hợp lệ: $AC"; exit 2; }
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC/pipeline"
exec bash ../db/db-thu.sh oneinvest_suite_nb9 --chay node --test --test-name-pattern "^E${N} " scripts/dong-the-bo-sung-tin.test.mjs
