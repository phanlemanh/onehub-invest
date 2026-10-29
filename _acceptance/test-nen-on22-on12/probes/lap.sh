#!/bin/bash
# AC-5: cả bộ test app 6 lần liên tiếp, 0 ca đỏ, số ca bằng nhau, 0 dòng thử lại lỗi DB tạm (thử lại không che tín hiệu).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
git status --porcelain --untracked-files=no | grep -q . && { echo "CAY BAN"; git status --porcelain --untracked-files=no; exit 1; }
bad=0; t0=""
for i in 1 2 3 4 5 6; do
  OUT=$(cd app && env -u NODE_TEST_CONTEXT npm test 2>&1)
  t=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ tests \([0-9]*\)$/\1/p' | tail -1)
  p=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ pass \([0-9]*\)$/\1/p' | tail -1)
  f=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ fail \([0-9]*\)$/\1/p' | tail -1)
  n=$(printf '%s\n' "$OUT" | grep -cE '# (lỗi DB tạm thời|bên ghi gặp lỗi DB tạm thời)')
  echo "lan $i: tests ${t:-?} pass ${p:-?} fail ${f:-?} · thu lai $n"
  [ "$n" = 0 ] || { echo "THU LAI TRONG LUOT ($n)"; bad=1; }
  [ -n "$t" ] && [ "$t" = "$p" ] && [ "$f" = 0 ] || { bad=1; printf '%s\n' "$OUT" | grep -A8 '^✖' | head -30; }
  [ -z "$t0" ] && t0=$t; [ "$t" = "$t0" ] || { echo "SO CA LECH ($t khac $t0)"; bad=1; }
done
[ $bad = 0 ] && echo "LAP 6 LAN XANH"
exit $bad
