#!/bin/bash
# AC-3: zalo-import-job-lan.test.mjs 4/4 xanh và không sót worktree tạm «zalo-lan-*» trong kho thật. Chỉ đếm worktree tạm của
# chính test — kho dùng chung có phiên khác thêm/gỡ worktree cùng lúc, so cả danh sách sẽ đỏ oan.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
dem() { git worktree list --porcelain | grep -c '^worktree .*/zalo-lan-'; }
truoc=$(dem)
OUT=$(env -u NODE_TEST_CONTEXT node --test scripts/zalo-import-job-lan.test.mjs 2>&1)
t=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ tests \([0-9]*\)$/\1/p' | tail -1)
p=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ pass \([0-9]*\)$/\1/p' | tail -1)
f=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ fail \([0-9]*\)$/\1/p' | tail -1)
sau=$(dem)
echo "zalo-import-job-lan: tests ${t:-?} pass ${p:-?} fail ${f:-?}"
echo "worktree tam zalo-lan con lai: $sau (truoc $truoc)"
bad=0
[ "$t" = 4 ] && [ "$p" = 4 ] && [ "$f" = 0 ] || { echo "TEST DO"; printf '%s\n' "$OUT" | tail -30; bad=1; }
[ "$sau" = 0 ] || { echo "CON WORKTREE TAM"; git worktree list --porcelain | grep '/zalo-lan-'; bad=1; }
[ $bad = 0 ] && echo "LAN OK"
exit $bad
