#!/usr/bin/env bash
# Chạy ca của một tiêu chí (doc.sh AC-3) hay cả tệp (doc.sh) trên DB thử riêng của lượt.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc/app"
mau=()
[ -n "${1:-}" ] && mau=(--test-name-pattern="CG3-$1 ")
exec bash ../db/db-thu.sh oneinvest_suite_cg3_doc --chay node --import tsx --test --test-concurrency=1 ${mau[@]+"${mau[@]}"} tests/deals-loc-xep-hang.test.tsx tests/deals-loc-xep-hang-loi.test.tsx
