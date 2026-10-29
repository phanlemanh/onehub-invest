#!/bin/bash
# AC-3: zalo-import-job-lan.test.mjs 4/4 xanh; dùng boWorktree (import + ≥2 chỗ gọi, không gọi thẳng "worktree","remove");
# worktree tạm «zalo-lan-*» MỚI sinh trong lượt (tập sau trừ tập trước) bằng rỗng. Đối chứng dương: bộ đếm bắt được một
# worktree mẫu «zalo-lan-» trong kho tạm. Kho dùng chung có thể có lượt chạy khác cùng lúc — chỉ đo phần chênh của lượt này.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
TEP=scripts/zalo-import-job-lan.test.mjs
ds() { git -C "$1" worktree list --porcelain | sed -n 's#^worktree \(.*/zalo-lan-[^/]*\).*#\1#p' | sort -u; }
bad=0
# đối chứng dương của bộ đếm
T=$(cd "$(mktemp -d)" && pwd -P); git -C "$T" init -q; git -C "$T" -c user.name=t -c user.email=t@l commit -q --allow-empty -m a
mkdir -p "$T/zalo-lan-mau"; git -C "$T" worktree add -q --detach "$T/zalo-lan-mau/wt" HEAD
[ "$(ds "$T" | grep -c .)" = 1 ] && echo "doi chung: bo dem bat 1/1 worktree mau" || { echo "DOI CHUNG KHONG BAT"; bad=1; }
git -C "$T" worktree remove --force "$T/zalo-lan-mau/wt"; rm -rf "$T"
grep -q 'from "./lib/bo-worktree.mjs"' "$TEP" && [ "$(grep -c 'boWorktree(' "$TEP")" -ge 2 ] && ! grep -qE '"worktree", *"remove"' "$TEP" \
  && echo "tep test dung boWorktree (import + $(grep -c 'boWorktree(' "$TEP") cho goi)" || { echo "KHONG DUNG BOWORKTREE"; bad=1; }
truoc=$(ds "$ROOT")
OUT=$(env -u NODE_TEST_CONTEXT node --test "$TEP" 2>&1)
sau=$(ds "$ROOT")
moi=$(comm -13 <(printf '%s\n' "$truoc") <(printf '%s\n' "$sau") | grep . || true)
t=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ tests \([0-9]*\)$/\1/p' | tail -1)
p=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ pass \([0-9]*\)$/\1/p' | tail -1)
f=$(printf '%s\n' "$OUT" | sed -n 's/^ℹ fail \([0-9]*\)$/\1/p' | tail -1)
echo "zalo-import-job-lan: tests ${t:-?} pass ${p:-?} fail ${f:-?}"
echo "worktree tam zalo-lan moi sinh con lai: $(printf '%s' "$moi" | grep -c .) (co san truoc luot: $(printf '%s' "$truoc" | grep -c .))"
[ "$t" = 4 ] && [ "$p" = 4 ] && [ "$f" = 0 ] || { echo "TEST DO"; printf '%s\n' "$OUT" | tail -30; bad=1; }
[ -z "$moi" ] || { echo "CON WORKTREE TAM"; printf '%s\n' "$moi"; bad=1; }
[ $bad = 0 ] && echo "LAN OK"
exit $bad
