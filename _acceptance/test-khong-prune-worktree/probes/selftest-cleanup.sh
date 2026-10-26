#!/bin/bash
# AC-5: rút NGUYÊN VĂN hàm cleanup() của selftest hook, chạy trên kho git tạm có worktree «của phiên khác» với thư mục vắng.
# Hai kịch bản: worktree remove lỗi (thư mục cây đã mất) và remove thành công. Bản sao hàm thay dòng gỡ metadata bằng
# `worktree prune` → đỏ với thông điệp ghim. Không đụng kho thật.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
SRC="$ROOT/.claude/hooks/tests/typecheck-changed.selftest.sh"
HAM=$(sed -n '/^cleanup() {$/,/^}$/p' "$SRC")
[ -n "$HAM" ] || { echo "KHONG RUT DUOC CLEANUP"; exit 2; }
printf '%s\n' "$HAM" | grep -q 'worktree prune' && { echo "CLEANUP SAI (con worktree prune)"; exit 1; }
DONG='case "$(cat "$d/gitdir")" in "$WT/.git") rm -rf "$d" ;; esac'
printf '%s\n' "$HAM" | grep -qF "$DONG" || { echo "DOT BIEN KHONG AP DUOC"; exit 2; }
HAM_PRUNE=${HAM/"$DONG"/'git -C "$REPO" worktree prune >/dev/null 2>&1'}
G() { git -c user.name=t -c user.email=t@local.test "$@"; }
# kich_ban <văn bản hàm> <loi|ok> → in «giu» hoặc «mat» (metadata worktree khác) và «sach» hoặc «con» (worktree của mình)
kich_ban() {
  local T; T=$(cd "$(mktemp -d)" && pwd -P)
  local K="$T/kho"; mkdir -p "$K"; G -C "$K" init -q; echo x > "$K/a"; G -C "$K" add a; G -C "$K" commit -qm a
  G -C "$K" worktree add -q --detach "$T/khac" HEAD; rm -rf "$T/khac"
  mkdir -p "$T/tmp"; G -C "$K" worktree add -q --detach "$T/tmp/wt" HEAD
  [ "$2" = loi ] && rm -rf "$T/tmp/wt"
  ( REPO="$K"; WT="$T/tmp/wt"; TMP="$T/tmp"; eval "$1"; cleanup )
  local giu=mat; grep -lqsF "$T/khac/.git" "$K"/.git/worktrees/*/gitdir && giu=giu
  local sach=con; grep -lqsF "$T/tmp/wt/.git" "$K"/.git/worktrees/*/gitdir || sach=sach
  rm -rf "$T"; echo "$giu $sach"
}
bad=0
a=$(kich_ban "$HAM" loi); b=$(kich_ban "$HAM" ok)
echo "cleanup ban sua: remove loi → $a, remove ok → $b"
[ "$a" = "giu sach" ] && [ "$b" = "giu sach" ] && echo "cleanup ban sua: remove loi → giu worktree khac, remove ok → giu worktree khac" || { echo "CLEANUP SAI"; bad=1; }
c=$(kich_ban "$HAM_PRUNE" loi)
if [ "${c%% *}" = mat ]; then echo "worktree của phiên khác bị gỡ metadata"; echo "cleanup ban prune: do, thong diep ghim co"; else echo "CA KHONG DO (ban prune: $c)"; bad=1; fi
[ $bad = 0 ] && echo "SELFTEST CLEANUP OK"
exit $bad
