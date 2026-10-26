#!/bin/bash
# AC-3: cả tệp scripts/audit-all.test.mjs 12 lần liên tiếp, 0 ca đỏ; số ca bằng nhau mọi lần.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
git status --porcelain --untracked-files=no | grep -q . && { echo "CAY BAN"; git status --porcelain --untracked-files=no; exit 1; }
# Số ca kỳ vọng suy từ main 53e2b83b: bản sửa thêm đúng một ca canh (MP-AC-1), không bớt ca nào.
t_cu=$(git show 53e2b83b:scripts/audit-all.test.mjs | grep -cE '^ +test\(') || { echo "KHONG DEM DUOC CA BAN CU"; exit 2; }
t_ky_vong=$((t_cu + 1)); echo "so ca ky vong: $t_ky_vong (ban cu $t_cu + ca canh)"
bad=0; t0=""
for i in $(seq 1 12); do
  OUT=$(env -u NODE_TEST_CONTEXT node --test scripts/audit-all.test.mjs 2>&1)
  t=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ tests \([0-9]*\)$/\1/p' | tail -1)
  p=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ pass \([0-9]*\)$/\1/p' | tail -1)
  f=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ fail \([0-9]*\)$/\1/p' | tail -1)
  echo "lan $i: tests ${t:-?} pass ${p:-?} fail ${f:-?}"
  [ -n "$t" ] && [ "$t" = "$p" ] && [ "$f" = 0 ] || { bad=1; printf '%s\n' "$OUT" | grep -B2 -A12 '^not ok' | head -40; }
  [ -z "$t0" ] && t0=$t; [ "$t" = "$t0" ] || { echo "SO CA LECH ($t khac $t0)"; bad=1; }
done
[ "${t0:-0}" = "$t_ky_vong" ] || { echo "SO CA KHAC KY VONG (${t0:-0} khac $t_ky_vong)"; bad=1; }
[ $bad = 0 ] && echo "LAP 12 LAN XANH"
exit $bad
