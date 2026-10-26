#!/bin/bash
# AC-1: bộ scripts/ xanh 5 lượt liên tiếp.
set -uo pipefail
cd "${1:?gốc kho}"; export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"; bad=0
for i in 1 2 3 4 5; do
  o=$(node --test scripts/*.test.mjs 2>&1); f=$(echo "$o" | grep -E '^ℹ fail ' ); s=$(echo "$o" | grep -E '^ℹ skipped ')
  echo "lượt $i: $(echo "$o" | grep -E '^ℹ pass ') · $f · $s"
  [ "$f" = "ℹ fail 0" ] && [ "$s" = "ℹ skipped 0" ] || { echo "$o" | grep -E '^✖' | head -3; bad=1; }
done
[ "$bad" = 0 ] && echo "NAM-LUOT OK"; exit "$bad"
